import test from 'node:test';
import assert from 'node:assert/strict';
import {SUPPORTED_LOCALES,setLocale,t} from './locale-v243.js';
import {AUTH_MESSAGES,AUTH_MESSAGE_KEYS,auditAuthMessages} from './locale-auth-messages-v247.js';
import {explainAuthError} from './account-auth.js';
test('16 known account status keys have translations in all 14 languages',()=>{
 assert.equal(AUTH_MESSAGE_KEYS.length,16);
 assert.deepEqual(Object.keys(AUTH_MESSAGES).sort(),[...SUPPORTED_LOCALES].sort());
 assert.deepEqual(auditAuthMessages(SUPPORTED_LOCALES),[]);
 for(const language of SUPPORTED_LOCALES){
  assert.deepEqual(Object.keys(AUTH_MESSAGES[language]).sort(),[...AUTH_MESSAGE_KEYS].sort());
  for(const [key,value] of Object.entries(AUTH_MESSAGES[language])){
   assert.ok(value?.trim(),language+':'+key);
   assert.doesNotMatch(value,/<script|javascript:|onerror\s*=/i);
  }
 }
});
test('localized account status and known provider error codes preserve outcomes',()=>{
 const codes=[[429,'over_email_send_rate_limit','auth.limit'],[400,'email_address_not_authorized','auth.unauthorized'],[400,'email_address_invalid','auth.badAddress'],[400,'email_not_confirmed','auth.notConfirmed'],[400,'invalid_credentials','auth.invalidCredentials']];
 try{for(const language of SUPPORTED_LOCALES){setLocale(language);
  for(const key of AUTH_MESSAGE_KEYS)assert.equal(t(key),AUTH_MESSAGES[language][key]);
  for(const [status,code,key] of codes)assert.equal(explainAuthError(status,{error_code:code}),t(key));
  assert.equal(explainAuthError(403,{message:'provider-detail'}),'provider-detail');
 }}finally{setLocale('tr');}
});
