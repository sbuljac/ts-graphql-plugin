import * as ts from 'typescript/lib/tsserverlibrary';
import { AdapterFixture } from '../testing/adapter-fixture';
import { createSimpleSchema } from '../testing/graphql-util/schema/simple-schema';

const notFoundCompletionInfo: ts.CompletionInfo = {
  entries: [],
  isGlobalCompletion: false,
  isMemberCompletion: false,
  isNewIdentifierLocation: false,
};

const delegateFn = () => notFoundCompletionInfo;

function createFixture(name: string, schemaJson?: { data: any }) {
  return new AdapterFixture(name, schemaJson);
}

describe('getCompletionAtPosition', () => {
  it('should delegate original method when schema is not set', () => {
    const fixture = createFixture('input.ts');
    const actual = fixture.adapter.getCompletionAtPosition(delegateFn, 'input.ts', 0);
    expect(actual).toBe(notFoundCompletionInfo);
  });

  it('should delegate original method when the cursor is not on Template String Literal', async () => {
    const fixture = createFixture('input.ts', await createSimpleSchema());
    fixture.source = 'const a = 1;';
    const actual = fixture.adapter.getCompletionAtPosition(delegateFn, 'input.ts', 0);
    expect(actual).toBe(notFoundCompletionInfo);
  });

  test('should return completion entries', async () => {
    const fixture = createFixture('input.ts', await createSimpleSchema());
    const completionFn = fixture.adapter.getCompletionAtPosition.bind(fixture.adapter, delegateFn, 'input.ts');

    fixture.source = 'const a = `';
    expect(completionFn(10)!.entries.length).toBeTruthy(); // return entries when cursor is at the start of the template

    fixture.source = 'const a = `q';
    expect(completionFn(11)!.entries.length);
    expect(completionFn(11)!.entries).toEqual([
      { kind: 'unknown' as ts.ScriptElementKind, kindModifiers: 'declare', name: '{', sortText: '0'},
      { kind: 'unknown' as ts.ScriptElementKind, kindModifiers: 'declare', name: 'query', sortText: '0'},
    ] as ts.CompletionEntry[]);

    fixture.source = 'const a = `query {';
    expect(completionFn(17)!.entries).toBeTruthy();
    expect(completionFn(17)!.entries.filter(e => e.name === 'hello').length).toBeTruthy(); // contains schema keyword;

    fixture.source = 'const a = `query { }`';
    expect(completionFn(17)!.entries).toBeTruthy();
    expect(completionFn(17)!.entries.filter(e => e.name === 'hello').length).toBeTruthy(); // contains schema keyword;
  });
});
