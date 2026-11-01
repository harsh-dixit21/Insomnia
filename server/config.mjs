export function serviceConfig(env=process.env,{local=false}={}){
 return {local,origin:env.INSOMNIA_ORIGIN||`http://127.0.0.1:${env.INSOMNIA_PORT||5181}`,
  mail:{host:env.SMTP_HOST,port:Number(env.SMTP_PORT||587),secure:env.SMTP_SECURE==='true',user:env.SMTP_USER,password:env.SMTP_PASSWORD,from:env.SMTP_FROM||'Insomnia <insomnia@localhost>',directory:env.INSOMNIA_MAIL_DIR||'.data/mail'},
  iomete:{url:env.IOMETE_SQLALCHEMY_URL,python:env.INSOMNIA_PYTHON||'python'},
  research:{key:env.TAVILY_API_KEY,url:env.TAVILY_URL||'https://api.tavily.com/search'},
  llm:{url:env.OLLAMA_URL||'http://127.0.0.1:11434',model:env.OLLAMA_MODEL},
  oidc:{issuer:env.OIDC_ISSUER,clientId:env.OIDC_CLIENT_ID,secret:env.OIDC_CLIENT_SECRET,label:env.OIDC_LABEL||'Organization SSO',allowHttp:local&&env.OIDC_ALLOW_LOCAL_HTTP==='true'}};
}
