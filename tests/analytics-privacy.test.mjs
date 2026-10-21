import test from 'node:test'
import assert from 'node:assert/strict'
import { publicAnalyticsPage, publicReferrer } from '../src/lib/analyticsPrivacy.js'
test('account and recovery URLs never become analytics pageviews',()=>{
  for(const path of ['/admin','/admin/vods','/account','/login','/register','/forgot-password','/update-password','/suspended']) {
    assert.equal(publicAnalyticsPage(`https://asteri-polaris.vercel.app${path}?code=secret#access_token=secret`),null)
  }
})
test('public pageviews and referrers omit query strings and fragments',()=>{
  assert.deepEqual(publicAnalyticsPage('https://asteri-polaris.vercel.app/equipo/?email=private#secret'),{page_path:'/equipo',page_location:'https://asteri-polaris.vercel.app/equipo'})
  assert.equal(publicReferrer('https://example.com/path?code=secret#private'),'https://example.com/path')
})
test('local review does not pollute production analytics',()=>{
  assert.equal(publicAnalyticsPage('http://127.0.0.1:5181/'),null)
  assert.equal(publicAnalyticsPage('http://localhost:5181/'),null)
  assert.equal(publicAnalyticsPage('invalid'),null)
})
