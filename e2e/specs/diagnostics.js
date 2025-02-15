const assert = require('assert');
const path = require('path');

function findResponse(responses, eventName) {
  return responses.find(response => response.event === eventName);
}

const fileContent = `declare function gql(...args: any[]): any;
const q = gql\`query { goodbye }\`;`;

async function run(server) {
  const file = path.resolve(__dirname, '../project-fixture/main.ts');
  server.send({ command: 'open', arguments: { file, fileContent, scriptKindName: "TS" } });
  await server.waitEvent('projectLoadingFinish');
  server.send({ command: 'geterr', arguments: { files: [file], delay: 0 } });
  await server.waitEvent('semanticDiag');
  return server.close().then(() => {
    const semanticDiagEvent = findResponse(server.responses, 'semanticDiag')
    assert(!!semanticDiagEvent)
    assert.equal(semanticDiagEvent.body.diagnostics.length, 1);
    assert.equal(semanticDiagEvent.body.diagnostics[0].text, 'Cannot query field "goodbye" on type "Query".');
  });
}

module.exports = run;
