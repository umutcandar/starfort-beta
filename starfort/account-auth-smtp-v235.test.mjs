import test from 'node:test';
import assert from 'node:assert/strict';
import {explainAuthError,accountSignIn,accountSignUp} from './account-auth.js';

test('production SMTP quota is explained without promising that mail was sent',()=>{
 assert.match(explainAuthError(429,{error_code:'over_email_send_rate_limit'}),/E-posta gönderim sınırına/);
 assert.match(explainAuthError(400,{error_code:'email_address_not_authorized'}),/yapılandırılmalı/);
 assert.match(explainAuthError(400,{error_code:'email_address_invalid'}),/geçersiz/);
 assert.match(explainAuthError(400,{error_code:'email_not_confirmed'}),/doğrulaması bekliyor/);
 assert.match(explainAuthError(400,{error_code:'invalid_credentials'}),/şifre hatalı/);
 assert.equal(explainAuthError(403,{message:'Sunucu hatası'}),'Sunucu hatası');
});
test('account signup stops on 429 and never falsely returns confirmation success',async()=>{
 const fetcher=async()=>({ok:false,status:429,json:async()=>({error_code:'over_email_send_rate_limit',msg:'email rate limit exceeded'})});
 await assert.rejects(accountSignUp('qa@example.com','Password-123',fetcher),/E-posta gönderim sınırına/);
});
test('sign-in rejects unverified email without fabricating an account session',async()=>{
 const fetcher=async()=>({ok:false,status:400,json:async()=>({error_code:'email_not_confirmed'})});
 await assert.rejects(accountSignIn('qa@example.com','Password-123',fetcher),/doğrulaması bekliyor/);
});
