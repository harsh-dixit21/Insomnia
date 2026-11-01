import nodemailer from 'nodemailer';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';

export function createMailer(config){
 const mail=config.mail;
 const transport=mail.host?nodemailer.createTransport({host:mail.host,port:mail.port,secure:mail.secure,requireTLS:!mail.secure&&!config.local,...(mail.user?{auth:{user:mail.user,pass:mail.password}}:{}),connectionTimeout:10000,socketTimeout:10000}):null;
 return {mode:transport?'smtp':config.local?'local-outbox':'unconfigured',async send({to,subject,text}){
  if(transport){const result=await transport.sendMail({from:mail.from,to,subject,text});if(!result.accepted?.length)throw new Error('Mail delivery was not accepted.');return;}
  if(!config.local)throw new Error('Email delivery is not configured.');
  await mkdir(mail.directory,{recursive:true});await writeFile(join(mail.directory,`${Date.now()}-${randomUUID()}.json`),JSON.stringify({to,subject,text,created:new Date().toISOString(),delivery:'Local development outbox; not sent externally.'},null,2),{mode:0o600});
 }};
}
