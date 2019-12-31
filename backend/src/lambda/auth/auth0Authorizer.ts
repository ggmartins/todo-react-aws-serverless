import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'

import { verify, decode } from 'jsonwebtoken'
import { createLogger } from '../../utils/logger'
import * as axios from 'axios'
import { Jwt } from '../../auth/Jwt'
import { JwtPayload } from '../../auth/JwtPayload'

const logger = createLogger('auth')

// TODO: Provide a URL that can be used to download a certificate that can be used
// to verify JWT token signature.
// To get this URL you need to go to an Auth0 page -> Show Advanced Settings -> Endpoints -> JSON Web Key Set
const jwksUrl = process.env.AUTH0_JWKS_URL
var jwks = null

export const handler = async (
  event: CustomAuthorizerEvent
): Promise<CustomAuthorizerResult> => {
  logger.info('Authorizing a user', event.authorizationToken)
  try {
    const jwtToken = await verifyToken(event.authorizationToken)
    logger.info('User was authorized', jwtToken)

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    logger.error('User not authorized', { error: e.message })

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

async function verifyToken(authHeader: string): Promise<JwtPayload> {
  const token = getToken(authHeader)
  const jwt: Jwt = decode(token, { complete: true }) as Jwt
  const { header } = jwt;
  
  logger.info('verifyingToken: getting url' );

  if (!jwks){
    logger.info('caching jwks');
    const response=await axios.default.get(jwksUrl)
    jwks={}
    jwks.keys=response.data.keys
    logger.info('keys:'+jwks.keys);
  }

  const jwtkeys = jwks.keys

  if ( !header || header.alg !== 'RS256' ) {
    logger.error('Token is not RS256 encoded');
    throw new Error( 'Token is not RS256 encoded' );
  }

  const key=jwtkeys.filter(
    ( key ) =>
      key.use === 'sig' && // JWK property `use` determines the JWK is for signing
      key.kty === 'RSA' && // We are only supporting RSA (RS256)
      key.kid && // The `kid` must be present to be useful for later
      ( ( key.x5c && key.x5c.length ) || ( key.n && key.e ) ) // Has useful public keys
  )
  .map( ( key ) => ( { kid: key.kid, nbf: key.nbf, publicKey: certToPEM( key.x5c[ 0 ] ) } ) )
  .find( ( key ) => key.kid === header.kid );

  const actualKey = key.publicKey || key.rsaPublicKey;


  return verify(token, actualKey, { algorithms: [ 'RS256' ]}) as JwtPayload //as JwtToken
  // TODO: Implement token verification
  // You should implement it similarly to how it was implemented for the exercise for the lesson 5
  // You can read more about how to do this here: https://auth0.com/blog/navigating-rs256-and-jwks/
  //return undefined
}

function getToken(authHeader: string): string {
  if (!authHeader) throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')
  const token = split[1]

  return token
}

function certToPEM( cert ) {
  let pem = cert.match( /.{1,64}/g ).join( '\n' );
  pem = `-----BEGIN CERTIFICATE-----\n${ cert }\n-----END CERTIFICATE-----\n`;
  return pem;
}