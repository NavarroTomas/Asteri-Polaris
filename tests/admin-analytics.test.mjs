import test from 'node:test'
import assert from 'node:assert/strict'
import { matchOutcome, teamAnalytics } from '../src/lib/adminAnalytics.js'

test('unknown scores are excluded, explicit outcomes take priority, upcoming matches have no result', () => {
  assert.equal(matchOutcome({status:'played',score_asteri:null,score_opponent:0}), null)
  assert.equal(matchOutcome({status:'played',score_asteri:'',score_opponent:0}), null)
  assert.equal(matchOutcome({status:'played',score_asteri:0,score_opponent:0}), 'draw')
  assert.equal(matchOutcome({status:'played',score_asteri:0,score_opponent:13,match_outcome:'win'}), 'win')
  assert.equal(matchOutcome({status:'scheduled',match_outcome:'win'}), null)
})
test('date window uses Argentina date and map results follow eligible published matches', () => {
  const base={status:'played',is_published:true,score_asteri:2,score_opponent:0}
  const vods=[{...base,id:'inside',match_date:'2026-09-19'}, {...base,id:'outside',match_date:'2026-09-18'}, {...base,id:'future',match_date:'2026-10-19'}, {...base,id:'draft',match_date:'2026-10-18',is_published:false}, {...base,id:'cancelled',match_date:'2026-10-18',status:'cancelled'}, {...base,id:'missing',match_date:'2026-10-18',score_asteri:null}]
  const maps=[{vod_id:'inside',map_name:'nuke',score_asteri:13,score_opponent:5}, {vod_id:'draft',map_name:'nuke',score_asteri:0,score_opponent:13}, {vod_id:'inside',map_name:'mirage',score_asteri:null,score_opponent:null}]
  const data=teamAnalytics(vods,maps,'30',new Date('2026-10-19T01:00:00Z'))
  assert.equal(data.played.length,2)
  assert.equal(data.missing,1)
  assert.equal(data.winRate,100)
  assert.deepEqual(data.maps,[{name:'nuke',played:1,win:1,loss:0,draw:0}])
  assert.deepEqual(data.monthly.map(m=>m.month),['2026-09','2026-10'])
})
test('empty data is not presented as zero percent performance',()=>{
  assert.equal(teamAnalytics([],[]).winRate,null)
})
