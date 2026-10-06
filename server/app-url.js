import {configurationError} from './startup-diagnostics.js';

export function resolveAppUrl(env=process.env,{required=false}={}) {
  const deployment=env.VERCEL_URL?.trim();
  const production=env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  const configured=env.APP_URL?.trim();
  // Trust deployment configuration, never request Host or forwarded headers.
  const candidate=env.VERCEL_ENV==='preview'&&deployment
    ? `https://${deployment}`
    : configured||(production?`https://${production}`:deployment?`https://${deployment}`:undefined);
  if(!candidate){
    if(required||env.VERCEL)throw configurationError('CONFIG_APP_URL','Configurá APP_URL o habilitá las variables de sistema de Vercel.');
    return undefined;
  }
  let url;
  try{url=new URL(candidate);}catch{throw configurationError('CONFIG_APP_URL','APP_URL debe ser una URL completa.');}
  if(!['https:','http:'].includes(url.protocol)||url.username||url.password)throw configurationError('CONFIG_APP_URL','APP_URL debe ser una URL HTTP o HTTPS sin credenciales.');
  return url.origin;
}
