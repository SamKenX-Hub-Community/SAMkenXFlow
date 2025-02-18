/*
 * @flow
 * @format
 */

import type {Suite} from 'flow-dev-tools/src/test/Suite';
const {suite, test} = require('flow-dev-tools/src/test/Tester');

module.exports = (suite(
  ({
    lspStartAndConnect,
    lspStart,
    lspRequest,
    lspInitializeParams,
    lspRequestAndWaitUntilResponse,
    addFile,
    lspIgnoreStatusAndCancellation,
  }) => [
    test('initialize with code actions support', [
      lspStart({needsFlowServer: false}),
      lspRequestAndWaitUntilResponse(
        'initialize',
        lspInitializeParams,
      ).verifyAllLSPMessagesInStep(
        [
          [
            'initialize',
            '{"codeActionProvider":{"codeActionKinds":["refactor.extract","quickfix"]}}',
          ],
        ],
        [...lspIgnoreStatusAndCancellation],
      ),
    ]),
    test('initialize without quickfix support', [
      lspStart({needsFlowServer: false}),
      lspRequestAndWaitUntilResponse('initialize', {
        ...lspInitializeParams,
        capabilities: {
          ...lspInitializeParams.capabilities,
          textDocument: {
            ...lspInitializeParams.capabilities.textDocument,
            codeAction: {
              codeActionLiteralSupport: {
                codeActionKind: {
                  valueSet: ['refactor.extract'],
                },
              },
            },
          },
        },
      }).verifyAllLSPMessagesInStep(
        [
          [
            'initialize',
            '{"codeActionProvider":{"codeActionKinds":["refactor.extract"]}}',
          ],
        ],
        [...lspIgnoreStatusAndCancellation],
      ),
    ]),
    test('initialize without refactor.extract support', [
      lspStart({needsFlowServer: false}),
      lspRequestAndWaitUntilResponse('initialize', {
        ...lspInitializeParams,
        capabilities: {
          ...lspInitializeParams.capabilities,
          textDocument: {
            ...lspInitializeParams.capabilities.textDocument,
            codeAction: {
              codeActionLiteralSupport: {
                codeActionKind: {
                  valueSet: ['quickfix'],
                },
              },
            },
          },
        },
      }).verifyAllLSPMessagesInStep(
        [
          [
            'initialize',
            '{"codeActionProvider":{"codeActionKinds":["quickfix"]}}',
          ],
        ],
        [...lspIgnoreStatusAndCancellation],
      ),
    ]),
    test('initialize without any code actions support', [
      lspStart({needsFlowServer: false}),
      lspRequestAndWaitUntilResponse('initialize', {
        ...lspInitializeParams,
        capabilities: {
          ...lspInitializeParams.capabilities,
          textDocument: {
            ...lspInitializeParams.capabilities.textDocument,
            codeAction: {},
          },
        },
      }).verifyAllLSPMessagesInStep(
        [['initialize', '{"codeActionProvider":false}']],
        [...lspIgnoreStatusAndCancellation],
      ),
    ]),
    test('provide quickfix for adding optional chaining', [
      addFile('add-optional-chaining.js.ignored', 'add-optional-chaining.js'),
      lspStartAndConnect(),
      lspRequestAndWaitUntilResponse('textDocument/codeAction', {
        textDocument: {
          uri: '<PLACEHOLDER_PROJECT_URL>/add-optional-chaining.js',
        },
        range: {
          start: {
            line: 3,
            character: 4,
          },
          end: {
            line: 3,
            character: 7,
          },
        },
        context: {
          only: ['quickfix'],
          diagnostics: [],
        },
      }).verifyAllLSPMessagesInStep(
        [
          {
            method: 'textDocument/codeAction',
            result: [
              {
                title: 'Add optional chaining for object that might be `null`',
                kind: 'quickfix',
                diagnostics: [],
                edit: {
                  changes: {
                    '<PLACEHOLDER_PROJECT_URL>/add-optional-chaining.js': [
                      {
                        range: {
                          start: {
                            line: 3,
                            character: 0,
                          },
                          end: {
                            line: 3,
                            character: 7,
                          },
                        },
                        newText: 'foo?.bar',
                      },
                    ],
                  },
                },
                command: {
                  title: '',
                  command: 'log:org.flow:<PLACEHOLDER_PROJECT_URL>',
                  arguments: [
                    'textDocument/codeAction',
                    'add_optional_chaining',
                    'Add optional chaining for object that might be `null`',
                  ],
                },
              },
              {
                title:
                  'Add optional chaining for object that might be `undefined`',
                kind: 'quickfix',
                diagnostics: [],
                edit: {
                  changes: {
                    '<PLACEHOLDER_PROJECT_URL>/add-optional-chaining.js': [
                      {
                        range: {
                          start: {
                            line: 3,
                            character: 0,
                          },
                          end: {
                            line: 3,
                            character: 7,
                          },
                        },
                        newText: 'foo?.bar',
                      },
                    ],
                  },
                },
                command: {
                  title: '',
                  command: 'log:org.flow:<PLACEHOLDER_PROJECT_URL>',
                  arguments: [
                    'textDocument/codeAction',
                    'add_optional_chaining',
                    'Add optional chaining for object that might be `undefined`',
                  ],
                },
              },
            ],
          },
        ],
        ['textDocument/publishDiagnostics', ...lspIgnoreStatusAndCancellation],
      ),
      lspRequestAndWaitUntilResponse('textDocument/codeAction', {
        textDocument: {
          uri: '<PLACEHOLDER_PROJECT_URL>/add-optional-chaining.js',
        },
        range: {
          start: {
            line: 5,
            character: 7,
          },
          end: {
            line: 5,
            character: 10,
          },
        },
        context: {
          only: ['quickfix'],
          diagnostics: [],
        },
      }).verifyAllLSPMessagesInStep(
        [
          {
            method: 'textDocument/codeAction',
            result: [
              {
                title: 'Add optional chaining for object that might be `null`',
                kind: 'quickfix',
                diagnostics: [],
                edit: {
                  changes: {
                    '<PLACEHOLDER_PROJECT_URL>/add-optional-chaining.js': [
                      {
                        range: {
                          start: {
                            line: 5,
                            character: 0,
                          },
                          end: {
                            line: 5,
                            character: 10,
                          },
                        },
                        newText: '(nested?.foo)',
                      },
                    ],
                  },
                },
                command: {
                  title: '',
                  command: 'log:org.flow:<PLACEHOLDER_PROJECT_URL>',
                  arguments: [
                    'textDocument/codeAction',
                    'add_optional_chaining',
                    'Add optional chaining for object that might be `null`',
                  ],
                },
              },
            ],
          },
        ],
        ['textDocument/publishDiagnostics', ...lspIgnoreStatusAndCancellation],
      ),
    ]),
    test('provide quickfix for PropMissing errors with dot syntax', [
      addFile('prop-missing.js.ignored', 'prop-missing.js'),
      lspStartAndConnect(),
      lspRequestAndWaitUntilResponse('textDocument/codeAction', {
        textDocument: {uri: '<PLACEHOLDER_PROJECT_URL>/prop-missing.js'},
        range: {
          start: {
            line: 3,
            character: 2,
          },
          end: {
            line: 3,
            character: 9,
          },
        },
        context: {
          only: ['quickfix'],
          diagnostics: [
            {
              range: {
                start: {
                  line: 3,
                  character: 2,
                },
                end: {
                  line: 3,
                  character: 9,
                },
              },
              message:
                'Cannot get `x.faceboy` because property `faceboy` (did you mean `facebook`?) is missing in  object type [1].',
              severity: 1,
              code: 'InferError',
              source: 'Flow',
            },
          ],
        },
      }).verifyAllLSPMessagesInStep(
        [
          {
            method: 'textDocument/codeAction',
            result: [
              {
                title: 'Replace `faceboy` with `facebook`',
                kind: 'quickfix',
                diagnostics: [
                  {
                    range: {
                      start: {
                        line: 3,
                        character: 2,
                      },
                      end: {
                        line: 3,
                        character: 9,
                      },
                    },
                    severity: 1,
                    code: 'InferError',
                    source: 'Flow',
                    message:
                      'Cannot get `x.faceboy` because property `faceboy` (did you mean `facebook`?) is missing in  object type [1].',
                    relatedInformation: [],
                    relatedLocations: [],
                  },
                ],
                edit: {
                  changes: {
                    '<PLACEHOLDER_PROJECT_URL>/prop-missing.js': [
                      {
                        range: {
                          start: {
                            line: 3,
                            character: 2,
                          },
                          end: {
                            line: 3,
                            character: 9,
                          },
                        },
                        newText: 'facebook',
                      },
                    ],
                  },
                },
                command: {
                  title: '',
                  command: 'log:org.flow:<PLACEHOLDER_PROJECT_URL>',
                  arguments: [
                    'textDocument/codeAction',
                    'replace_prop_typo_at_target',
                    'Replace `faceboy` with `facebook`',
                  ],
                },
              },
            ],
          },
        ],
        ['textDocument/publishDiagnostics', ...lspIgnoreStatusAndCancellation],
      ),
    ]),
    test('provide quickfix for PropMissing errors with bracket syntax', [
      addFile(
        'prop-missing-bracket-syntax.js.ignored',
        'prop-missing-bracket-syntax.js',
      ),
      lspStartAndConnect(),
      lspRequestAndWaitUntilResponse('textDocument/codeAction', {
        textDocument: {
          uri: '<PLACEHOLDER_PROJECT_URL>/prop-missing-bracket-syntax.js',
        },
        range: {
          start: {
            line: 3,
            character: 2,
          },
          end: {
            line: 3,
            character: 11,
          },
        },
        context: {
          only: ['quickfix'],
          diagnostics: [
            {
              range: {
                start: {
                  line: 3,
                  character: 2,
                },
                end: {
                  line: 3,
                  character: 11,
                },
              },
              message:
                'Cannot get `x.faceboy` because property `faceboy` (did you mean `facebook`?) is missing in  object type [1].',
              severity: 1,
              code: 'InferError',
              source: 'Flow',
            },
          ],
        },
      }).verifyAllLSPMessagesInStep(
        [
          {
            method: 'textDocument/codeAction',
            result: [
              {
                title: 'Replace `faceboy` with `facebook`',
                kind: 'quickfix',
                diagnostics: [
                  {
                    range: {
                      start: {
                        line: 3,
                        character: 2,
                      },
                      end: {
                        line: 3,
                        character: 11,
                      },
                    },
                    severity: 1,
                    code: 'InferError',
                    source: 'Flow',
                    message:
                      'Cannot get `x.faceboy` because property `faceboy` (did you mean `facebook`?) is missing in  object type [1].',
                    relatedInformation: [],
                    relatedLocations: [],
                  },
                ],
                edit: {
                  changes: {
                    '<PLACEHOLDER_PROJECT_URL>/prop-missing-bracket-syntax.js':
                      [
                        {
                          range: {
                            start: {
                              line: 3,
                              character: 2,
                            },
                            end: {
                              line: 3,
                              character: 11,
                            },
                          },
                          newText: '"facebook"',
                        },
                      ],
                  },
                },
                command: {
                  title: '',
                  command: 'log:org.flow:<PLACEHOLDER_PROJECT_URL>',
                  arguments: [
                    'textDocument/codeAction',
                    'replace_prop_typo_at_target',
                    'Replace `faceboy` with `facebook`',
                  ],
                },
              },
            ],
          },
        ],
        ['textDocument/publishDiagnostics', ...lspIgnoreStatusAndCancellation],
      ),
    ]),
    test('provide quickfix for invalid enum member access errors', [
      addFile(
        'invalid-enum-member-access.js.ignored',
        'invalid-enum-member-access.js',
      ),
      lspStartAndConnect(),
      lspRequestAndWaitUntilResponse('textDocument/codeAction', {
        textDocument: {
          uri: '<PLACEHOLDER_PROJECT_URL>/invalid-enum-member-access.js',
        },
        range: {
          start: {
            line: 6,
            character: 2,
          },
          end: {
            line: 6,
            character: 8,
          },
        },
        context: {
          only: ['quickfix'],
          diagnostics: [
            {
              range: {
                start: {
                  line: 6,
                  character: 2,
                },
                end: {
                  line: 6,
                  character: 8,
                },
              },
              message:
                'Cannot access property `Foobat` because `Foobat` is not a member of `enum E`. Did you meanthe member `Foobar`?',
              severity: 1,
              code: 'InferError',
              source: 'Flow',
            },
          ],
        },
      }).verifyAllLSPMessagesInStep(
        [
          {
            method: 'textDocument/codeAction',
            result: [
              {
                title: 'Replace `Foobat` with `Foobar`',
                kind: 'quickfix',
                diagnostics: [
                  {
                    range: {
                      start: {
                        line: 6,
                        character: 2,
                      },
                      end: {
                        line: 6,
                        character: 8,
                      },
                    },
                    severity: 1,
                    code: 'InferError',
                    source: 'Flow',
                    message:
                      'Cannot access property `Foobat` because `Foobat` is not a member of `enum E`. Did you meanthe member `Foobar`?',
                    relatedInformation: [],
                    relatedLocations: [],
                  },
                ],
                edit: {
                  changes: {
                    '<PLACEHOLDER_PROJECT_URL>/invalid-enum-member-access.js': [
                      {
                        range: {
                          start: {
                            line: 6,
                            character: 2,
                          },
                          end: {
                            line: 6,
                            character: 8,
                          },
                        },
                        newText: 'Foobar',
                      },
                    ],
                  },
                },
                command: {
                  title: '',
                  command: 'log:org.flow:<PLACEHOLDER_PROJECT_URL>',
                  arguments: [
                    'textDocument/codeAction',
                    'replace_enum_prop_typo_at_target',
                    'Replace `Foobat` with `Foobar`',
                  ],
                },
              },
            ],
          },
        ],
        ['textDocument/publishDiagnostics', ...lspIgnoreStatusAndCancellation],
      ),
    ]),
    test("don't provide quickfixes for object subtyping errors", [
      addFile('object-cast.js.ignored', 'object-cast.js'),
      lspStartAndConnect(),
      lspRequestAndWaitUntilResponse('textDocument/codeAction', {
        textDocument: {uri: '<PLACEHOLDER_PROJECT_URL>/object-cast.js'},
        range: {
          start: {
            line: 3,
            character: 1,
          },
          end: {
            line: 3,
            character: 14,
          },
        },
        context: {
          only: ['quickfix'],
          diagnostics: [
            {
              range: {
                start: {
                  line: 3,
                  character: 1,
                },
                end: {
                  line: 3,
                  character: 14,
                },
              },
              message:
                'Cannot cast object literal to `T` because property `floo` (did you mean `foo`?) is missing in  `T` [1] but exists in  object literal [2].',
              severity: 1,
              code: 'InferError',
              source: 'Flow',
            },
            {
              range: {
                start: {
                  line: 3,
                  character: 1,
                },
                end: {
                  line: 3,
                  character: 14,
                },
              },
              message:
                'Cannot cast object literal to `T` because property `foo` (did you mean `floo`?) is missing in  object literal [1] but exists in  `T` [2].',
              severity: 1,
              code: 'InferError',
              source: 'Flow',
            },
          ],
        },
      }).verifyAllLSPMessagesInStep(
        [
          {
            method: 'textDocument/codeAction',
            result: [],
          },
        ],
        ['textDocument/publishDiagnostics', ...lspIgnoreStatusAndCancellation],
      ),
    ]),
    test('provide quickfix for parse error', [
      addFile('parse-error.js.ignored', 'parse-error.js'),
      lspStartAndConnect(),
      lspRequestAndWaitUntilResponse('textDocument/codeAction', {
        textDocument: {uri: '<PLACEHOLDER_PROJECT_URL>/parse-error.js'},
        range: {
          start: {
            line: 4,
            character: 6,
          },
          end: {
            line: 4,
            character: 6,
          },
        },
        context: {
          only: ['quickfix'],
          diagnostics: [
            {
              range: {
                start: {
                  line: 4,
                  character: 6,
                },
                end: {
                  line: 4,
                  character: 7,
                },
              },
              message: "Unexpected token `>`. Did you mean `{'>'}`?",
              severity: 1,
              code: 'ParseError',
              relatedInformation: [],
              source: 'Flow',
            },
          ],
        },
      }).verifyAllLSPMessagesInStep(
        [
          {
            method: 'textDocument/codeAction',
            result: [
              {
                title: "Replace `>` with `{'>'}`",
                kind: 'quickfix',
                diagnostics: [
                  {
                    range: {
                      start: {
                        line: 4,
                        character: 6,
                      },
                      end: {
                        line: 4,
                        character: 7,
                      },
                    },
                    severity: 1,
                    code: 'ParseError',
                    source: 'Flow',
                    message: "Unexpected token `>`. Did you mean `{'>'}`?",
                    relatedInformation: [],
                    relatedLocations: [],
                  },
                ],
                edit: {
                  changes: {
                    '<PLACEHOLDER_PROJECT_URL>/parse-error.js': [
                      {
                        range: {
                          start: {
                            line: 4,
                            character: 6,
                          },
                          end: {
                            line: 4,
                            character: 7,
                          },
                        },
                        newText: "{'>'}",
                      },
                    ],
                  },
                },
                command: {
                  title: '',
                  command: 'log:org.flow:<PLACEHOLDER_PROJECT_URL>',
                  arguments: [
                    'textDocument/codeAction',
                    'fix_parse_error',
                    "Replace `>` with `{'>'}`",
                  ],
                },
              },
            ],
          },
        ],
        ['textDocument/publishDiagnostics', ...lspIgnoreStatusAndCancellation],
      ),
    ]),
    test('provide quickfix for ClassObject errors', [
      addFile('class-object-subtype.js.ignored', 'class-object-subtype.js'),
      lspStartAndConnect(),
      lspRequestAndWaitUntilResponse('textDocument/codeAction', {
        textDocument: {
          uri: '<PLACEHOLDER_PROJECT_URL>/class-object-subtype.js',
        },
        range: {
          start: {
            line: 8,
            character: 4,
          },
          end: {
            line: 8,
            character: 11,
          },
        },
        context: {
          only: ['quickfix'],
          diagnostics: [
            {
              range: {
                start: {
                  line: 8,
                  character: 4,
                },
                end: {
                  line: 8,
                  character: 11,
                },
              },
              message:
                'Cannot call foo with new A() bound to x because cannot subtype class A [1] with object type [2]. Please use an interface instead.',
              severity: 1,
              code: 'InferError',
              source: 'Flow',
            },
          ],
        },
      }).verifyAllLSPMessagesInStep(
        [
          {
            method: 'textDocument/codeAction',
            result: [
              {
                title: 'Rewrite object type as an interface',
                kind: 'quickfix',
                diagnostics: [
                  {
                    range: {
                      start: {
                        line: 8,
                        character: 4,
                      },
                      end: {
                        line: 8,
                        character: 11,
                      },
                    },
                    severity: 1,
                    code: 'InferError',
                    source: 'Flow',
                    message:
                      'Cannot call foo with new A() bound to x because cannot subtype class A [1] with object type [2]. Please use an interface instead.',
                    relatedInformation: [],
                    relatedLocations: [],
                  },
                ],
                edit: {
                  changes: {
                    '<PLACEHOLDER_PROJECT_URL>/class-object-subtype.js': [
                      {
                        range: {
                          start: {
                            line: 6,
                            character: 17,
                          },
                          end: {
                            line: 6,
                            character: 35,
                          },
                        },
                        newText: 'interface { x: number }',
                      },
                    ],
                  },
                },
                command: {
                  title: '',
                  command: 'log:org.flow:<PLACEHOLDER_PROJECT_URL>',
                  arguments: [
                    'textDocument/codeAction',
                    'replace_obj_with_interface',
                    'Rewrite object type as an interface',
                  ],
                },
              },
            ],
          },
        ],
        [
          'textDocument/publishDiagnostics',
          'window/showStatus',
          '$/cancelRequest',
        ],
      ),
    ]),
    test('provide quickfix for nested ClassObject errors', [
      addFile('class-object-subtype.js.ignored', 'class-object-subtype.js'),
      lspStartAndConnect(),
      lspRequestAndWaitUntilResponse('textDocument/codeAction', {
        textDocument: {
          uri: '<PLACEHOLDER_PROJECT_URL>/class-object-subtype.js',
        },
        range: {
          start: {
            line: 12,
            character: 9,
          },
          end: {
            line: 12,
            character: 16,
          },
        },
        context: {
          only: ['quickfix'],
          diagnostics: [
            {
              range: {
                start: {
                  line: 12,
                  character: 9,
                },
                end: {
                  line: 12,
                  character: 16,
                },
              },
              message:
                'Cannot call `bar` with object literal bound to `_` because cannot subtype class  `A` [1] with  object type [2]. Please use an interface instead in property `i`.',
              severity: 1,
              code: 'InferError',
              source: 'Flow',
            },
          ],
        },
      }).verifyAllLSPMessagesInStep(
        [
          {
            method: 'textDocument/codeAction',
            result: [
              {
                title: 'Rewrite object type as an interface',
                kind: 'quickfix',
                diagnostics: [
                  {
                    range: {
                      start: {
                        line: 12,
                        character: 9,
                      },
                      end: {
                        line: 12,
                        character: 16,
                      },
                    },
                    severity: 1,
                    code: 'InferError',
                    source: 'Flow',
                    message:
                      'Cannot call `bar` with object literal bound to `_` because cannot subtype class  `A` [1] with  object type [2]. Please use an interface instead in property `i`.',
                    relatedInformation: [],
                    relatedLocations: [],
                  },
                ],
                edit: {
                  changes: {
                    '<PLACEHOLDER_PROJECT_URL>/class-object-subtype.js': [
                      {
                        range: {
                          start: {
                            line: 10,
                            character: 23,
                          },
                          end: {
                            line: 10,
                            character: 39,
                          },
                        },
                        newText: 'interface { x: number }',
                      },
                    ],
                  },
                },
                command: {
                  title: '',
                  command: 'log:org.flow:<PLACEHOLDER_PROJECT_URL>',
                  arguments: [
                    'textDocument/codeAction',
                    'replace_obj_with_interface',
                    'Rewrite object type as an interface',
                  ],
                },
              },
            ],
          },
        ],
        [
          'textDocument/publishDiagnostics',
          'window/showStatus',
          '$/cancelRequest',
        ],
      ),
    ]),
    test('provide quickfix for aliased ClassObject errors', [
      addFile('class-object-subtype.js.ignored', 'class-object-subtype.js'),
      lspStartAndConnect(),
      lspRequestAndWaitUntilResponse('textDocument/codeAction', {
        textDocument: {
          uri: '<PLACEHOLDER_PROJECT_URL>/class-object-subtype.js',
        },
        range: {
          start: {
            line: 18,
            character: 4,
          },
          end: {
            line: 18,
            character: 11,
          },
        },
        context: {
          only: ['quickfix'],
          diagnostics: [
            {
              range: {
                start: {
                  line: 18,
                  character: 4,
                },
                end: {
                  line: 18,
                  character: 4,
                },
              },
              message:
                'Cannot call `baz` with object literal bound to `_` because cannot subtype class  `A` [1] with  object type [2]. Please use an interface instead in property `i`.',
              severity: 1,
              code: 'InferError',
              source: 'Flow',
            },
          ],
        },
      }).verifyAllLSPMessagesInStep(
        [
          {
            method: 'textDocument/codeAction',
            result: [
              {
                title: 'Rewrite `T` as an interface',
                kind: 'quickfix',
                diagnostics: [
                  {
                    range: {
                      start: {
                        line: 18,
                        character: 4,
                      },
                      end: {
                        line: 18,
                        character: 4,
                      },
                    },
                    severity: 1,
                    code: 'InferError',
                    source: 'Flow',
                    message:
                      'Cannot call `baz` with object literal bound to `_` because cannot subtype class  `A` [1] with  object type [2]. Please use an interface instead in property `i`.',
                    relatedInformation: [],
                    relatedLocations: [],
                  },
                ],
                edit: {
                  changes: {
                    '<PLACEHOLDER_PROJECT_URL>/class-object-subtype.js': [
                      {
                        range: {
                          start: {
                            line: 14,
                            character: 9,
                          },
                          end: {
                            line: 14,
                            character: 27,
                          },
                        },
                        newText: 'interface { x: number }',
                      },
                    ],
                  },
                },
                command: {
                  title: '',
                  command: 'log:org.flow:<PLACEHOLDER_PROJECT_URL>',
                  arguments: [
                    'textDocument/codeAction',
                    'replace_obj_with_interface',
                    'Rewrite `T` as an interface',
                  ],
                },
              },
            ],
          },
        ],
        [
          'textDocument/publishDiagnostics',
          'window/showStatus',
          '$/cancelRequest',
        ],
      ),
    ]),
    test('provide codeAction for cross-file ClassObject errors', [
      addFile('class-object-subtype.js.ignored', 'class-object-subtype.js'),
      addFile('lib.js.ignored', 'lib.js'),
      lspStartAndConnect(),
      lspRequestAndWaitUntilResponse('textDocument/codeAction', {
        textDocument: {
          uri: '<PLACEHOLDER_PROJECT_URL>/class-object-subtype.js',
        },
        range: {
          start: {
            line: 22,
            character: 4,
          },
          end: {
            line: 22,
            character: 11,
          },
        },
        context: {
          only: ['quickfix'],
          diagnostics: [
            {
              range: {
                start: {
                  line: 22,
                  character: 4,
                },
                end: {
                  line: 22,
                  character: 11,
                },
              },
              message:
                'Cannot call `qux` with object literal bound to `_` because cannot subtype class  `A` [1] with  object type [2]. Please use an interface instead in property `i`.',
              severity: 1,
              code: 'InferError',
              source: 'Flow',
            },
          ],
        },
      }).verifyAllLSPMessagesInStep(
        [
          {
            method: 'textDocument/codeAction',
            result: [
              {
                title: 'Rewrite object type as an interface',
                kind: 'quickfix',
                diagnostics: [
                  {
                    range: {
                      start: {
                        line: 22,
                        character: 4,
                      },
                      end: {
                        line: 22,
                        character: 11,
                      },
                    },
                    severity: 1,
                    code: 'InferError',
                    source: 'Flow',
                    message:
                      'Cannot call `qux` with object literal bound to `_` because cannot subtype class  `A` [1] with  object type [2]. Please use an interface instead in property `i`.',
                    relatedInformation: [],
                    relatedLocations: [],
                  },
                ],
                edit: {
                  changes: {
                    '<PLACEHOLDER_PROJECT_URL>/lib.js': [
                      {
                        range: {
                          start: {
                            line: 2,
                            character: 24,
                          },
                          end: {
                            line: 2,
                            character: 42,
                          },
                        },
                        newText: 'interface { x: number }',
                      },
                    ],
                  },
                },
                command: {
                  title: '',
                  command: 'log:org.flow:<PLACEHOLDER_PROJECT_URL>',
                  arguments: [
                    'textDocument/codeAction',
                    'replace_obj_with_interface',
                    'Rewrite object type as an interface',
                  ],
                },
              },
            ],
          },
        ],
        [
          'textDocument/publishDiagnostics',
          'window/showStatus',
          '$/cancelRequest',
        ],
      ),
    ]),
    test('provide codeAction for MethodUnbinding errors', [
      addFile('method-unbinding.js.ignored', 'method-unbinding.js'),
      lspStartAndConnect(),
      lspRequestAndWaitUntilResponse('textDocument/codeAction', {
        textDocument: {
          uri: '<PLACEHOLDER_PROJECT_URL>/method-unbinding.js',
        },
        range: {
          start: {
            line: 6,
            character: 8,
          },
          end: {
            line: 6,
            character: 9,
          },
        },
        context: {
          only: ['quickfix'],
          diagnostics: [
            {
              range: {
                start: {
                  line: 6,
                  character: 8,
                },
                end: {
                  line: 6,
                  character: 9,
                },
              },
              message:
                'Cannot get `(new A).f` because  property `f` [1] cannot be unbound from the  context [2] where it was defined.',
              severity: 1,
              code: 'InferError',
              source: 'Flow',
            },
          ],
        },
      }).verifyAllLSPMessagesInStep(
        [
          [
            'textDocument/codeAction',
            JSON.stringify([
              {
                title: 'Rewrite function as an arrow function',
                kind: 'quickfix',
                diagnostics: [
                  {
                    range: {
                      start: {line: 6, character: 8},
                      end: {line: 6, character: 9},
                    },
                    severity: 1,
                    code: 'InferError',
                    source: 'Flow',
                    message:
                      'Cannot get `(new A).f` because  property `f` [1] cannot be unbound from the  context [2] where it was defined.',
                    relatedInformation: [],
                    relatedLocations: [],
                  },
                ],
                edit: {
                  changes: {
                    '<PLACEHOLDER_PROJECT_URL>/method-unbinding.js': [
                      {
                        range: {
                          start: {
                            line: 2,
                            character: 0,
                          },
                          end: {
                            line: 4,
                            character: 1,
                          },
                        },
                        newText:
                          'class A {\n  f = (x: number): number => {\n    return x;\n  };\n}',
                      },
                    ],
                  },
                },
                command: {
                  title: '',
                  command: 'log:org.flow:<PLACEHOLDER_PROJECT_URL>',
                  arguments: [
                    'textDocument/codeAction',
                    'replace_method_with_arrow',
                    'Rewrite function as an arrow function',
                  ],
                },
              },
            ]),
          ],
        ],
        ['textDocument/publishDiagnostics', ...lspIgnoreStatusAndCancellation],
      ),
    ]),
    test('ignore method unbinding when super is used', [
      addFile('method-unbinding.js.ignored', 'method-unbinding.js'),
      lspStartAndConnect(),
      lspRequestAndWaitUntilResponse('textDocument/codeAction', {
        textDocument: {
          uri: '<PLACEHOLDER_PROJECT_URL>/method-unbinding.js',
        },
        range: {
          start: {
            line: 6,
            character: 8,
          },
          end: {
            line: 6,
            character: 9,
          },
        },
        context: {
          diagnostics: [
            {
              range: {
                start: {
                  line: 12,
                  character: 8,
                },
                end: {
                  line: 12,
                  character: 9,
                },
              },
              message:
                'Cannot get `(new B).f` because  property `f` [1] cannot be unbound from the  context [2] where it was defined.',
              severity: 1,
              code: 'InferError',
              source: 'Flow',
            },
          ],
        },
      }).verifyAllLSPMessagesInStep(
        [['textDocument/codeAction', '[]']],
        ['textDocument/publishDiagnostics', ...lspIgnoreStatusAndCancellation],
      ),
    ]),
    test('provide codeAction for basic extract function', [
      addFile(
        'refactor-extract-function-basic.js.ignored',
        'refactor-extract-function-basic.js',
      ),
      lspStartAndConnect(),
      // Partial selection is not allowed and gives no results.
      lspRequestAndWaitUntilResponse('textDocument/codeAction', {
        textDocument: {
          uri: '<PLACEHOLDER_PROJECT_URL>/refactor-extract-function-basic.js',
        },
        range: {
          start: {
            line: 4,
            character: 2,
          },
          end: {
            line: 5,
            character: 15,
          },
        },
        context: {
          only: ['refactor'],
          diagnostics: [],
        },
      }).verifyAllLSPMessagesInStep(
        [
          {
            method: 'textDocument/codeAction',
            result: [],
          },
        ],
        ['textDocument/publishDiagnostics', ...lspIgnoreStatusAndCancellation],
      ),
      // Full selection is allowed and gives one result.
      lspRequestAndWaitUntilResponse('textDocument/codeAction', {
        textDocument: {
          uri: '<PLACEHOLDER_PROJECT_URL>/refactor-extract-function-basic.js',
        },
        range: {
          start: {
            line: 4,
            character: 2,
          },
          end: {
            line: 5,
            character: 21,
          },
        },
        context: {
          only: ['refactor'],
          diagnostics: [],
        },
      }).verifyAllLSPMessagesInStep(
        [
          {
            method: 'textDocument/codeAction',
            result: [
              {
                title: 'Extract to function in module scope',
                kind: 'refactor.extract',
                diagnostics: [],
                edit: {
                  changes: {
                    '<PLACEHOLDER_PROJECT_URL>/refactor-extract-function-basic.js':
                      [
                        {
                          range: {
                            start: {
                              line: 4,
                              character: 2,
                            },
                            end: {
                              line: 5,
                              character: 21,
                            },
                          },
                          newText: 'newFunction();',
                        },
                        {
                          range: {
                            start: {
                              line: 7,
                              character: 1,
                            },
                            end: {
                              line: 7,
                              character: 1,
                            },
                          },
                          newText:
                            '\nfunction newFunction(): void {\n  console.log("foo");\n  console.log("bar");\n}',
                        },
                      ],
                  },
                },
                command: {
                  title: '',
                  command: 'log:org.flow:<PLACEHOLDER_PROJECT_URL>',
                  arguments: [
                    'textDocument/codeAction',
                    'refactor_extract',
                    'Extract to function in module scope',
                  ],
                },
              },
              {
                title: "Extract to inner function in function 'fooBar'",
                kind: 'refactor.extract',
                diagnostics: [],
                edit: {
                  changes: {
                    '<PLACEHOLDER_PROJECT_URL>/refactor-extract-function-basic.js':
                      [
                        {
                          range: {
                            start: {
                              line: 4,
                              character: 2,
                            },
                            end: {
                              line: 5,
                              character: 21,
                            },
                          },
                          newText: 'newFunction();',
                        },
                        {
                          range: {
                            start: {
                              line: 6,
                              character: 25,
                            },
                            end: {
                              line: 6,
                              character: 25,
                            },
                          },
                          newText:
                            'function newFunction(): void {\n    console.log("foo");\n    console.log("bar");\n  }',
                        },
                      ],
                  },
                },
                command: {
                  title: '',
                  command: 'log:org.flow:<PLACEHOLDER_PROJECT_URL>',
                  arguments: [
                    'textDocument/codeAction',
                    'refactor_extract',
                    "Extract to inner function in function 'fooBar'",
                  ],
                },
              },
            ],
          },
        ],
        ['textDocument/publishDiagnostics', ...lspIgnoreStatusAndCancellation],
      ),
    ]),
    test('provide codeAction for statements with comments', [
      addFile(
        'refactor-extract-with-comments.js.ignored',
        'refactor-extract-with-comments.js',
      ),
      lspStartAndConnect(),
      lspRequestAndWaitUntilResponse('textDocument/codeAction', {
        textDocument: {
          uri: '<PLACEHOLDER_PROJECT_URL>/refactor-extract-with-comments.js',
        },
        range: {
          start: {
            line: 3,
            character: 2,
          },
          end: {
            line: 6,
            character: 26,
          },
        },
        context: {
          only: ['refactor'],
          diagnostics: [],
        },
      }).verifyAllLSPMessagesInStep(
        [
          {
            method: 'textDocument/codeAction',
            result: [
              {
                title: 'Extract to function in module scope',
                kind: 'refactor.extract',
                diagnostics: [],
                edit: {
                  changes: {
                    '<PLACEHOLDER_PROJECT_URL>/refactor-extract-with-comments.js':
                      [
                        {
                          range: {
                            start: {line: 3, character: 2},
                            end: {line: 6, character: 26},
                          },
                          newText: 'let {a, barr, fooo} = newFunction();',
                        },
                        {
                          range: {
                            start: {line: 9, character: 1},
                            end: {
                              line: 9,
                              character: 1,
                            },
                          },
                          newText:
                            '\nfunction newFunction(): {| a: number, barr: number, fooo: number |} {\n  // comment before\n  let fooo = 3; // selected\n  let barr = 4; // selected\n  const a = 3; // selected\n  return { a, barr, fooo };\n}',
                        },
                      ],
                  },
                },
                command: {
                  title: '',
                  command: 'log:org.flow:<PLACEHOLDER_PROJECT_URL>',
                  arguments: [
                    'textDocument/codeAction',
                    'refactor_extract',
                    'Extract to function in module scope',
                  ],
                },
              },
              {
                title: "Extract to inner function in function 'i_am_a_test'",
                kind: 'refactor.extract',
                diagnostics: [],
                edit: {
                  changes: {
                    '<PLACEHOLDER_PROJECT_URL>/refactor-extract-with-comments.js':
                      [
                        {
                          range: {
                            start: {line: 3, character: 2},
                            end: {line: 6, character: 26},
                          },
                          newText: 'let {a, barr, fooo} = newFunction();',
                        },
                        {
                          range: {
                            start: {line: 8, character: 15},
                            end: {line: 8, character: 15},
                          },
                          newText:
                            'function newFunction(): {| a: number, barr: number, fooo: number |} {\n    // comment before\n    let fooo = 3; // selected\n    let barr = 4; // selected\n    const a = 3; // selected\n    return { a, barr, fooo };\n  }',
                        },
                      ],
                  },
                },
                command: {
                  title: '',
                  command: 'log:org.flow:<PLACEHOLDER_PROJECT_URL>',
                  arguments: [
                    'textDocument/codeAction',
                    'refactor_extract',
                    "Extract to inner function in function 'i_am_a_test'",
                  ],
                },
              },
            ],
          },
        ],
        ['textDocument/publishDiagnostics', ...lspIgnoreStatusAndCancellation],
      ),
    ]),
    test('provide codeAction for extract function with type imports', [
      addFile(
        'refactor-extract-function-type-provider.js.ignored',
        'refactor-extract-function-type-provider.js',
      ),
      addFile(
        'refactor-extract-function-import-type.js.ignored',
        'refactor-extract-function-import-type.js',
      ),
      lspStartAndConnect(),
      lspRequestAndWaitUntilResponse('textDocument/codeAction', {
        textDocument: {
          uri: '<PLACEHOLDER_PROJECT_URL>/refactor-extract-function-import-type.js',
        },
        range: {start: {line: 7, character: 2}, end: {line: 7, character: 19}},
        context: {
          only: ['refactor'],
          diagnostics: [],
        },
      }).verifyAllLSPMessagesInStep(
        [
          {
            method: 'textDocument/codeAction',
            result: [
              {
                title: 'Extract to function in module scope',
                kind: 'refactor.extract',
                diagnostics: [],
                edit: {
                  changes: {
                    '<PLACEHOLDER_PROJECT_URL>/refactor-extract-function-import-type.js':
                      [
                        {
                          range: {
                            start: {line: 2, character: 0},
                            end: {line: 2, character: 0},
                          },
                          newText:
                            'import type { Foo } from "./refactor-extract-function-type-provider";\n\n',
                        },
                        {
                          range: {
                            start: {line: 7, character: 2},
                            end: {line: 7, character: 13},
                          },
                          newText: '(newFunction)',
                        },
                        {
                          range: {
                            start: {line: 8, character: 1},
                            end: {line: 8, character: 1},
                          },
                          newText:
                            '\nfunction newFunction(foo: Foo): void {\n  console.log(foo);\n}',
                        },
                      ],
                  },
                },
                command: {
                  title: '',
                  command: 'log:org.flow:<PLACEHOLDER_PROJECT_URL>',
                  arguments: [
                    'textDocument/codeAction',
                    'refactor_extract',
                    'Extract to function in module scope',
                  ],
                },
              },
              {
                title: "Extract to inner function in function 'test'",
                kind: 'refactor.extract',
                diagnostics: [],
                edit: {
                  changes: {
                    '<PLACEHOLDER_PROJECT_URL>/refactor-extract-function-import-type.js':
                      [
                        {
                          range: {
                            start: {line: 7, character: 2},
                            end: {line: 7, character: 18},
                          },
                          newText: 'newFunction()',
                        },
                        {
                          range: {
                            start: {line: 7, character: 19},
                            end: {line: 7, character: 19},
                          },
                          newText:
                            '\nfunction newFunction(): void {\n    console.log(foo);\n  }',
                        },
                      ],
                  },
                },
                command: {
                  title: '',
                  command: 'log:org.flow:<PLACEHOLDER_PROJECT_URL>',
                  arguments: [
                    'textDocument/codeAction',
                    'refactor_extract',
                    "Extract to inner function in function 'test'",
                  ],
                },
              },
            ],
          },
        ],
        ['textDocument/publishDiagnostics', ...lspIgnoreStatusAndCancellation],
      ),
      lspRequestAndWaitUntilResponse('textDocument/codeAction', {
        textDocument: {
          uri: '<PLACEHOLDER_PROJECT_URL>/refactor-extract-function-import-type.js',
        },
        range: {start: {line: 6, character: 2}, end: {line: 6, character: 24}},
        context: {
          only: ['refactor'],
          diagnostics: [],
        },
      }).verifyAllLSPMessagesInStep(
        [
          {
            method: 'textDocument/codeAction',
            result: [
              {
                title: 'Extract to function in module scope',
                kind: 'refactor.extract',
                diagnostics: [],
                edit: {
                  changes: {
                    '<PLACEHOLDER_PROJECT_URL>/refactor-extract-function-import-type.js':
                      [
                        {
                          range: {
                            start: {line: 2, character: 0},
                            end: {line: 2, character: 0},
                          },
                          newText:
                            'import type { Foo } from "./refactor-extract-function-type-provider";\n\n',
                        },
                        {
                          range: {
                            start: {line: 6, character: 14},
                            end: {line: 6, character: 23},
                          },
                          newText: 'newFunction(getFoo2)',
                        },
                        {
                          range: {
                            start: {line: 8, character: 1},
                            end: {line: 8, character: 1},
                          },
                          newText:
                            '\nfunction newFunction(getFoo2: () => Foo): Foo {\n  const foo = getFoo2();\n  return foo;\n}',
                        },
                      ],
                  },
                },
                command: {
                  title: '',
                  command: 'log:org.flow:<PLACEHOLDER_PROJECT_URL>',
                  arguments: [
                    'textDocument/codeAction',
                    'refactor_extract',
                    'Extract to function in module scope',
                  ],
                },
              },
              {
                title: "Extract to inner function in function 'test'",
                kind: 'refactor.extract',
                diagnostics: [],
                edit: {
                  changes: {
                    '<PLACEHOLDER_PROJECT_URL>/refactor-extract-function-import-type.js':
                      [
                        {
                          range: {
                            start: {line: 2, character: 0},
                            end: {line: 2, character: 0},
                          },
                          newText:
                            'import type { Foo } from "./refactor-extract-function-type-provider";\n\n',
                        },
                        {
                          range: {
                            start: {line: 6, character: 14},
                            end: {line: 6, character: 21},
                          },
                          newText: 'newFunction',
                        },
                        {
                          range: {
                            start: {line: 7, character: 19},
                            end: {line: 7, character: 19},
                          },
                          newText:
                            'function newFunction(): Foo {\n    const foo = getFoo2();\n    return foo;\n  }',
                        },
                      ],
                  },
                },
                command: {
                  title: '',
                  command: 'log:org.flow:<PLACEHOLDER_PROJECT_URL>',
                  arguments: [
                    'textDocument/codeAction',
                    'refactor_extract',
                    "Extract to inner function in function 'test'",
                  ],
                },
              },
            ],
          },
        ],
        ['textDocument/publishDiagnostics', ...lspIgnoreStatusAndCancellation],
      ),
    ]),
    test(
      'provide codeAction for basic extract method, constant, class fields.',
      [
        addFile(
          'refactor-extract-method.js.ignored',
          'refactor-extract-method.js',
        ),
        lspStartAndConnect(),
        // Partial selection is not allowed and gives no results.
        lspRequestAndWaitUntilResponse('textDocument/codeAction', {
          textDocument: {
            uri: '<PLACEHOLDER_PROJECT_URL>/refactor-extract-method.js',
          },
          range: {
            start: {line: 4, character: 4},
            end: {line: 4, character: 16},
          },
          context: {
            only: ['refactor'],
            diagnostics: [],
          },
        }).verifyAllLSPMessagesInStep(
          [
            {
              method: 'textDocument/codeAction',
              result: [
                {
                  title: "Extract to method in class 'Test'",
                  kind: 'refactor.extract',
                  diagnostics: [],
                  edit: {
                    changes: {
                      '<PLACEHOLDER_PROJECT_URL>/refactor-extract-method.js': [
                        {
                          range: {
                            start: {line: 2, character: 0},
                            end: {line: 6, character: 1},
                          },
                          newText:
                            'class Test {\n  test(): void {\n    this.newMethod();\n  }\n  newMethod(): void {\n    this.test();\n  }\n}',
                        },
                      ],
                    },
                  },
                  command: {
                    title: '',
                    command: 'log:org.flow:<PLACEHOLDER_PROJECT_URL>',
                    arguments: [
                      'textDocument/codeAction',
                      'refactor_extract',
                      "Extract to method in class 'Test'",
                    ],
                  },
                },
              ],
            },
          ],
          [
            'textDocument/publishDiagnostics',
            ...lspIgnoreStatusAndCancellation,
          ],
        ),
        lspRequestAndWaitUntilResponse('textDocument/codeAction', {
          textDocument: {
            uri: '<PLACEHOLDER_PROJECT_URL>/refactor-extract-method.js',
          },
          range: {
            start: {line: 4, character: 4},
            end: {line: 4, character: 15},
          },
          context: {
            only: ['refactor'],
            diagnostics: [],
          },
        }).verifyAllLSPMessagesInStep(
          [
            {
              method: 'textDocument/codeAction',
              result: [
                {
                  title: "Extract to field in class 'Test'",
                  kind: 'refactor.extract',
                  diagnostics: [],
                  edit: {
                    changes: {
                      '<PLACEHOLDER_PROJECT_URL>/refactor-extract-method.js': [
                        {
                          range: {
                            start: {line: 2, character: 0},
                            end: {line: 6, character: 1},
                          },
                          newText:
                            'class Test {\n  newProperty = this.test();\n  test(): void {\n    this.newProperty;\n  }\n}',
                        },
                      ],
                    },
                  },
                  command: {
                    title: '',
                    command: 'log:org.flow:<PLACEHOLDER_PROJECT_URL>',
                    arguments: [
                      'textDocument/codeAction',
                      'refactor_extract',
                      "Extract to field in class 'Test'",
                    ],
                  },
                },
                {
                  title: "Extract to constant in method 'test'",
                  kind: 'refactor.extract',
                  diagnostics: [],
                  edit: {
                    changes: {
                      '<PLACEHOLDER_PROJECT_URL>/refactor-extract-method.js': [
                        {
                          range: {
                            start: {line: 4, character: 4},
                            end: {line: 4, character: 16},
                          },
                          newText:
                            'const newLocal = this.test();\n    newLocal;',
                        },
                      ],
                    },
                  },
                  command: {
                    title: '',
                    command: 'log:org.flow:<PLACEHOLDER_PROJECT_URL>',
                    arguments: [
                      'textDocument/codeAction',
                      'refactor_extract',
                      "Extract to constant in method 'test'",
                    ],
                  },
                },
              ],
            },
          ],
          [
            'textDocument/publishDiagnostics',
            ...lspIgnoreStatusAndCancellation,
          ],
        ),
      ],
    ),
    test('provide codeAction for basic extract type alias', [
      addFile(
        'refactor-extract-type-alias.js.ignored',
        'refactor-extract-type-alias.js',
      ),
      lspStartAndConnect(),
      lspRequestAndWaitUntilResponse('textDocument/codeAction', {
        textDocument: {
          uri: '<PLACEHOLDER_PROJECT_URL>/refactor-extract-type-alias.js',
        },
        range: {
          start: {line: 3, character: 11},
          end: {line: 3, character: 17},
        },
        context: {
          only: ['refactor'],
          diagnostics: [],
        },
      }).verifyAllLSPMessagesInStep(
        [
          {
            method: 'textDocument/codeAction',
            result: [
              {
                title: 'Extract to type alias',
                kind: 'refactor.extract',
                diagnostics: [],
                edit: {
                  changes: {
                    '<PLACEHOLDER_PROJECT_URL>/refactor-extract-type-alias.js':
                      [
                        {
                          range: {
                            start: {
                              line: 3,
                              character: 2,
                            },
                            end: {
                              line: 3,
                              character: 22,
                            },
                          },
                          newText:
                            'type NewType = number;\n  const a: NewType = 3;',
                        },
                      ],
                  },
                },
                command: {
                  title: '',
                  command: 'log:org.flow:<PLACEHOLDER_PROJECT_URL>',
                  arguments: [
                    'textDocument/codeAction',
                    'refactor_extract',
                    'Extract to type alias',
                  ],
                },
              },
            ],
          },
        ],
        ['textDocument/publishDiagnostics', ...lspIgnoreStatusAndCancellation],
      ),
    ]),
    test('obey context.only', [
      addFile('only-filter.js.ignored', 'only-filter.js'),
      lspStartAndConnect(),
      // no context.only gets back a quickfix and refactor
      lspRequestAndWaitUntilResponse('textDocument/codeAction', {
        textDocument: {
          uri: '<PLACEHOLDER_PROJECT_URL>/only-filter.js',
        },
        range: {
          start: {
            line: 3,
            character: 0,
          },
          end: {
            line: 3,
            character: 7,
          },
        },
        context: {
          diagnostics: [],
        },
      }).verifyAllLSPMessagesInStep(
        [
          {
            method: 'textDocument/codeAction',
            result: [
              {
                title: 'Organize imports',
                kind: 'source.organizeImports.flow',
                diagnostics: [],
                command: {
                  title: '',
                  command:
                    'source.organizeImports:org.flow:<PLACEHOLDER_PROJECT_URL>',
                  arguments: [
                    {
                      uri: '<PLACEHOLDER_PROJECT_URL>/only-filter.js',
                    },
                  ],
                },
              },
              {
                title: 'Extract to constant in module scope',
                kind: 'refactor.extract',
                diagnostics: [],
                edit: {
                  changes: {
                    '<PLACEHOLDER_PROJECT_URL>/only-filter.js': [
                      {
                        range: {
                          start: {
                            line: 3,
                            character: 0,
                          },
                          end: {
                            line: 3,
                            character: 8,
                          },
                        },
                        newText: 'const newLocal = foo.bar;\nnewLocal;',
                      },
                    ],
                  },
                },
                command: {
                  title: '',
                  command: 'log:org.flow:<PLACEHOLDER_PROJECT_URL>',
                  arguments: [
                    'textDocument/codeAction',
                    'refactor_extract',
                    'Extract to constant in module scope',
                  ],
                },
              },
              {
                title:
                  'Add optional chaining for object that might be `undefined`',
                kind: 'quickfix',
                diagnostics: [],
                edit: {
                  changes: {
                    '<PLACEHOLDER_PROJECT_URL>/only-filter.js': [
                      {
                        range: {
                          start: {
                            line: 3,
                            character: 0,
                          },
                          end: {
                            line: 3,
                            character: 7,
                          },
                        },
                        newText: 'foo?.bar',
                      },
                    ],
                  },
                },
                command: {
                  title: '',
                  command: 'log:org.flow:<PLACEHOLDER_PROJECT_URL>',
                  arguments: [
                    'textDocument/codeAction',
                    'add_optional_chaining',
                    'Add optional chaining for object that might be `undefined`',
                  ],
                },
              },
            ],
          },
        ],
        ['textDocument/publishDiagnostics', ...lspIgnoreStatusAndCancellation],
      ),
      // context.only: ["refactor"] only gets the refactor
      lspRequestAndWaitUntilResponse('textDocument/codeAction', {
        textDocument: {
          uri: '<PLACEHOLDER_PROJECT_URL>/only-filter.js',
        },
        range: {
          start: {
            line: 3,
            character: 0,
          },
          end: {
            line: 3,
            character: 7,
          },
        },
        context: {
          diagnostics: [],
          only: ['refactor'],
        },
      }).verifyAllLSPMessagesInStep(
        [
          {
            method: 'textDocument/codeAction',
            result: [
              {
                title: 'Extract to constant in module scope',
                kind: 'refactor.extract',
                diagnostics: [],
                edit: {
                  changes: {
                    '<PLACEHOLDER_PROJECT_URL>/only-filter.js': [
                      {
                        range: {
                          start: {
                            line: 3,
                            character: 0,
                          },
                          end: {
                            line: 3,
                            character: 8,
                          },
                        },
                        newText: 'const newLocal = foo.bar;\nnewLocal;',
                      },
                    ],
                  },
                },
                command: {
                  title: '',
                  command: 'log:org.flow:<PLACEHOLDER_PROJECT_URL>',
                  arguments: [
                    'textDocument/codeAction',
                    'refactor_extract',
                    'Extract to constant in module scope',
                  ],
                },
              },
            ],
          },
        ],
        ['textDocument/publishDiagnostics', ...lspIgnoreStatusAndCancellation],
      ),
      // context.only: ["quickfix"] only gets the quickfix
      lspRequestAndWaitUntilResponse('textDocument/codeAction', {
        textDocument: {
          uri: '<PLACEHOLDER_PROJECT_URL>/only-filter.js',
        },
        range: {
          start: {
            line: 3,
            character: 0,
          },
          end: {
            line: 3,
            character: 7,
          },
        },
        context: {
          diagnostics: [],
          only: ['quickfix'],
        },
      }).verifyAllLSPMessagesInStep(
        [
          {
            method: 'textDocument/codeAction',
            result: [
              {
                title:
                  'Add optional chaining for object that might be `undefined`',
                kind: 'quickfix',
                diagnostics: [],
                edit: {
                  changes: {
                    '<PLACEHOLDER_PROJECT_URL>/only-filter.js': [
                      {
                        range: {
                          start: {
                            line: 3,
                            character: 0,
                          },
                          end: {
                            line: 3,
                            character: 7,
                          },
                        },
                        newText: 'foo?.bar',
                      },
                    ],
                  },
                },
                command: {
                  title: '',
                  command: 'log:org.flow:<PLACEHOLDER_PROJECT_URL>',
                  arguments: [
                    'textDocument/codeAction',
                    'add_optional_chaining',
                    'Add optional chaining for object that might be `undefined`',
                  ],
                },
              },
            ],
          },
        ],
        ['textDocument/publishDiagnostics', ...lspIgnoreStatusAndCancellation],
      ),
    ]),
    test('skip non-@flow files', [
      addFile('not_flow.js.ignored', 'not_flow.js'),
      lspStartAndConnect(),
      lspRequestAndWaitUntilResponse('textDocument/codeAction', {
        textDocument: {
          uri: '<PLACEHOLDER_PROJECT_URL>/not_flow.js',
        },
        range: {
          start: {
            line: 1,
            character: 2,
          },
          end: {
            line: 1,
            character: 6,
          },
        },
        context: {
          diagnostics: [],
        },
      }).verifyAllLSPMessagesInStep(
        [
          {
            method: 'textDocument/codeAction',
            result: [],
          },
        ],
        ['textDocument/publishDiagnostics', ...lspIgnoreStatusAndCancellation],
      ),
    ]),
    test('provide quickfix for unused promise errors', [
      addFile('fix-unused-promise.js.ignored', 'fix-unused-promise.js'),
      lspStartAndConnect(),
      lspRequestAndWaitUntilResponse('textDocument/codeAction', {
        textDocument: {
          uri: '<PLACEHOLDER_PROJECT_URL>/fix-unused-promise.js',
        },
        range: {
          start: {
            line: 5,
            character: 5,
          },
          end: {
            line: 5,
            character: 5,
          },
        },
        context: {
          only: ['quickfix'],
          diagnostics: [],
        },
      }).verifyAllLSPMessagesInStep(
        [
          {
            method: 'textDocument/codeAction',
            result: [
              {
                title: 'Insert `await`',
                kind: 'quickfix',
                diagnostics: [],
                edit: {
                  changes: {
                    '<PLACEHOLDER_PROJECT_URL>/fix-unused-promise.js': [
                      {
                        range: {
                          start: {
                            line: 5,
                            character: 4,
                          },
                          end: {
                            line: 5,
                            character: 9,
                          },
                        },
                        newText: 'await foo()',
                      },
                    ],
                  },
                },
                command: {
                  title: '',
                  command: 'log:org.flow:<PLACEHOLDER_PROJECT_URL>',
                  arguments: [
                    'textDocument/codeAction',
                    'insert_await',
                    'Insert `await`',
                  ],
                },
              },
              {
                title: 'Insert `void`',
                kind: 'quickfix',
                diagnostics: [],
                edit: {
                  changes: {
                    '<PLACEHOLDER_PROJECT_URL>/fix-unused-promise.js': [
                      {
                        range: {
                          start: {
                            line: 5,
                            character: 4,
                          },
                          end: {
                            line: 5,
                            character: 9,
                          },
                        },
                        newText: 'void foo()',
                      },
                    ],
                  },
                },
                command: {
                  title: '',
                  command: 'log:org.flow:<PLACEHOLDER_PROJECT_URL>',
                  arguments: [
                    'textDocument/codeAction',
                    'insert_void',
                    'Insert `void`',
                  ],
                },
              },
            ],
          },
        ],
        ['textDocument/publishDiagnostics'],
      ),
    ]),
    test('provide autoimport for missing import', [
      addFile('import-provider.js.ignored', 'import-provider.js'),
      addFile('fix-missing-import.js.ignored', 'fix-missing-import.js'),
      lspStartAndConnect(),
      lspRequestAndWaitUntilResponse('textDocument/codeAction', {
        textDocument: {
          uri: '<PLACEHOLDER_PROJECT_URL>/fix-missing-import.js',
        },
        range: {
          start: {line: 4, character: 9},
          end: {line: 4, character: 10},
        },
        context: {
          only: ['quickfix'],
          diagnostics: [],
        },
      }).verifyAllLSPMessagesInStep(
        [
          {
            method: 'textDocument/codeAction',
            result: [
              {
                title: 'Import type from ./import-provider',
                kind: 'quickfix',
                diagnostics: [],
                edit: {
                  changes: {
                    '<PLACEHOLDER_PROJECT_URL>/fix-missing-import.js': [
                      {
                        range: {
                          start: {line: 2, character: 0},
                          end: {line: 2, character: 41},
                        },
                        newText:
                          'import type { A, B } from "./import-provider";',
                      },
                    ],
                  },
                },
                command: {
                  title: '',
                  command: 'log:org.flow:<PLACEHOLDER_PROJECT_URL>',
                  arguments: [
                    'textDocument/codeAction',
                    'import',
                    'Import type from ./import-provider',
                  ],
                },
              },
            ],
          },
        ],
        ['textDocument/publishDiagnostics', ...lspIgnoreStatusAndCancellation],
      ),
    ]),
    test('provide quickfix for `unknown` type', [
      addFile('fix-unknown-type.js.ignored', 'fix-unknown-type.js'),
      lspStartAndConnect(),
      lspRequestAndWaitUntilResponse('textDocument/codeAction', {
        textDocument: {
          uri: '<PLACEHOLDER_PROJECT_URL>/fix-unknown-type.js',
        },
        range: {
          start: {
            line: 2,
            character: 9,
          },
          end: {
            line: 2,
            character: 16,
          },
        },
        context: {
          only: ['quickfix'],
          diagnostics: [],
        },
      }).verifyAllLSPMessagesInStep(
        [
          {
            method: 'textDocument/codeAction',
            result: [
              {
                title: 'Convert to `mixed`',
                kind: 'quickfix',
                diagnostics: [],
                edit: {
                  changes: {
                    '<PLACEHOLDER_PROJECT_URL>/fix-unknown-type.js': [
                      {
                        range: {
                          start: {
                            line: 2,
                            character: 9,
                          },
                          end: {
                            line: 2,
                            character: 16,
                          },
                        },
                        newText: 'mixed',
                      },
                    ],
                  },
                },
                command: {
                  title: '',
                  command: 'log:org.flow:<PLACEHOLDER_PROJECT_URL>',
                  arguments: [
                    'textDocument/codeAction',
                    'convert_unknown_type',
                    'Convert to `mixed`',
                  ],
                },
              },
            ],
          },
        ],
        ['textDocument/publishDiagnostics'],
      ),
    ]),
    test('provide quickfix for `never` type', [
      addFile('fix-never-type.js.ignored', 'fix-never-type.js'),
      lspStartAndConnect(),
      lspRequestAndWaitUntilResponse('textDocument/codeAction', {
        textDocument: {
          uri: '<PLACEHOLDER_PROJECT_URL>/fix-never-type.js',
        },
        range: {
          start: {
            line: 2,
            character: 9,
          },
          end: {
            line: 2,
            character: 14,
          },
        },
        context: {
          only: ['quickfix'],
          diagnostics: [],
        },
      }).verifyAllLSPMessagesInStep(
        [
          {
            method: 'textDocument/codeAction',
            result: [
              {
                title: 'Convert to `empty`',
                kind: 'quickfix',
                diagnostics: [],
                edit: {
                  changes: {
                    '<PLACEHOLDER_PROJECT_URL>/fix-never-type.js': [
                      {
                        range: {
                          start: {
                            line: 2,
                            character: 9,
                          },
                          end: {
                            line: 2,
                            character: 14,
                          },
                        },
                        newText: 'empty',
                      },
                    ],
                  },
                },
                command: {
                  title: '',
                  command: 'log:org.flow:<PLACEHOLDER_PROJECT_URL>',
                  arguments: [
                    'textDocument/codeAction',
                    'convert_never_type',
                    'Convert to `empty`',
                  ],
                },
              },
            ],
          },
        ],
        ['textDocument/publishDiagnostics'],
      ),
    ]),
    test('provide quickfix for `undefined` type', [
      addFile('fix-undefined-type.js.ignored', 'fix-undefined-type.js'),
      lspStartAndConnect(),
      lspRequestAndWaitUntilResponse('textDocument/codeAction', {
        textDocument: {
          uri: '<PLACEHOLDER_PROJECT_URL>/fix-undefined-type.js',
        },
        range: {
          start: {
            line: 2,
            character: 9,
          },
          end: {
            line: 2,
            character: 18,
          },
        },
        context: {
          only: ['quickfix'],
          diagnostics: [],
        },
      }).verifyAllLSPMessagesInStep(
        [
          {
            method: 'textDocument/codeAction',
            result: [
              {
                title: 'Convert to `void`',
                kind: 'quickfix',
                diagnostics: [],
                edit: {
                  changes: {
                    '<PLACEHOLDER_PROJECT_URL>/fix-undefined-type.js': [
                      {
                        range: {
                          start: {
                            line: 2,
                            character: 9,
                          },
                          end: {
                            line: 2,
                            character: 18,
                          },
                        },
                        newText: 'void',
                      },
                    ],
                  },
                },
                command: {
                  title: '',
                  command: 'log:org.flow:<PLACEHOLDER_PROJECT_URL>',
                  arguments: [
                    'textDocument/codeAction',
                    'convert_undefined_type',
                    'Convert to `void`',
                  ],
                },
              },
            ],
          },
        ],
        ['textDocument/publishDiagnostics'],
      ),
    ]),
    test('provide quickfix for `keyof`', [
      addFile('fix-keyof.js.ignored', 'fix-keyof.js'),
      lspStartAndConnect(),
      lspRequestAndWaitUntilResponse('textDocument/codeAction', {
        textDocument: {
          uri: '<PLACEHOLDER_PROJECT_URL>/fix-keyof.js',
        },
        range: {
          start: {
            line: 2,
            character: 9,
          },
          end: {
            line: 2,
            character: 16,
          },
        },
        context: {
          only: ['quickfix'],
          diagnostics: [],
        },
      }).verifyAllLSPMessagesInStep(
        [
          {
            method: 'textDocument/codeAction',
            result: [
              {
                title: 'Convert to `$Keys<T>`',
                kind: 'quickfix',
                diagnostics: [],
                edit: {
                  changes: {
                    '<PLACEHOLDER_PROJECT_URL>/fix-keyof.js': [
                      {
                        range: {
                          start: {
                            line: 2,
                            character: 9,
                          },
                          end: {
                            line: 2,
                            character: 16,
                          },
                        },
                        newText: '$Keys<O>',
                      },
                    ],
                  },
                },
                command: {
                  title: '',
                  command: 'log:org.flow:<PLACEHOLDER_PROJECT_URL>',
                  arguments: [
                    'textDocument/codeAction',
                    'convert_keyof_type',
                    'Convert to `$Keys<T>`',
                  ],
                },
              },
            ],
          },
        ],
        ['textDocument/publishDiagnostics'],
      ),
    ]),
    test('provide quickfix for `extends` in type param', [
      addFile('fix-type-param-extends.js.ignored', 'fix-type-param-extends.js'),
      lspStartAndConnect(),
      lspRequestAndWaitUntilResponse('textDocument/codeAction', {
        textDocument: {
          uri: '<PLACEHOLDER_PROJECT_URL>/fix-type-param-extends.js',
        },
        range: {
          start: {
            line: 2,
            character: 7,
          },
          end: {
            line: 2,
            character: 23,
          },
        },
        context: {
          only: ['quickfix'],
          diagnostics: [],
        },
      }).verifyAllLSPMessagesInStep(
        [
          {
            method: 'textDocument/codeAction',
            result: [
              {
                title: 'Convert to `: T`',
                kind: 'quickfix',
                diagnostics: [],
                edit: {
                  changes: {
                    '<PLACEHOLDER_PROJECT_URL>/fix-type-param-extends.js': [
                      {
                        range: {
                          start: {
                            line: 2,
                            character: 7,
                          },
                          end: {
                            line: 2,
                            character: 23,
                          },
                        },
                        newText: 'A: string',
                      },
                    ],
                  },
                },
                command: {
                  title: '',
                  command: 'log:org.flow:<PLACEHOLDER_PROJECT_URL>',
                  arguments: [
                    'textDocument/codeAction',
                    'convert_type_param_extends',
                    'Convert to `: T`',
                  ],
                },
              },
            ],
          },
        ],
        ['textDocument/publishDiagnostics'],
      ),
    ]),
    test('provide quickfix for `readonly` variance', [
      addFile('fix-readonly-variance.js.ignored', 'fix-readonly-variance.js'),
      lspStartAndConnect(),
      lspRequestAndWaitUntilResponse('textDocument/codeAction', {
        textDocument: {
          uri: '<PLACEHOLDER_PROJECT_URL>/fix-readonly-variance.js',
        },
        range: {
          start: {
            line: 2,
            character: 10,
          },
          end: {
            line: 2,
            character: 18,
          },
        },
        context: {
          only: ['quickfix'],
          diagnostics: [],
        },
      }).verifyAllLSPMessagesInStep(
        [
          {
            method: 'textDocument/codeAction',
            result: [
              {
                title: 'Convert to `+`',
                kind: 'quickfix',
                diagnostics: [],
                edit: {
                  changes: {
                    '<PLACEHOLDER_PROJECT_URL>/fix-readonly-variance.js': [
                      {
                        range: {
                          start: {
                            line: 2,
                            character: 9,
                          },
                          end: {
                            line: 2,
                            character: 31,
                          },
                        },
                        newText: '{ +foo: number }',
                      },
                    ],
                  },
                },
                command: {
                  title: '',
                  command: 'log:org.flow:<PLACEHOLDER_PROJECT_URL>',
                  arguments: [
                    'textDocument/codeAction',
                    'convert_readonly_variance',
                    'Convert to `+`',
                  ],
                },
              },
            ],
          },
        ],
        ['textDocument/publishDiagnostics'],
      ),
    ]),
    test('provide quickfix for `in` variance', [
      addFile('fix-in-variance.js.ignored', 'fix-in-variance.js'),
      lspStartAndConnect(),
      lspRequestAndWaitUntilResponse('textDocument/codeAction', {
        textDocument: {
          uri: '<PLACEHOLDER_PROJECT_URL>/fix-in-variance.js',
        },
        range: {
          start: {
            line: 2,
            character: 20,
          },
          end: {
            line: 2,
            character: 21,
          },
        },
        context: {
          only: ['quickfix'],
          diagnostics: [],
        },
      }).verifyAllLSPMessagesInStep(
        [
          {
            method: 'textDocument/codeAction',
            result: [
              {
                title: 'Convert to `-`',
                kind: 'quickfix',
                diagnostics: [],
                edit: {
                  changes: {
                    '<PLACEHOLDER_PROJECT_URL>/fix-in-variance.js': [
                      {
                        range: {
                          start: {
                            line: 2,
                            character: 18,
                          },
                          end: {
                            line: 2,
                            character: 33,
                          },
                        },
                        newText: ': (<-A>(A) => void)',
                      },
                    ],
                  },
                },
                command: {
                  title: '',
                  command: 'log:org.flow:<PLACEHOLDER_PROJECT_URL>',
                  arguments: [
                    'textDocument/codeAction',
                    'convert_in_variance',
                    'Convert to `-`',
                  ],
                },
              },
            ],
          },
        ],
        ['textDocument/publishDiagnostics'],
      ),
    ]),
    test('provide quickfix for `out` variance', [
      addFile('fix-out-variance.js.ignored', 'fix-out-variance.js'),
      lspStartAndConnect(),
      lspRequestAndWaitUntilResponse('textDocument/codeAction', {
        textDocument: {
          uri: '<PLACEHOLDER_PROJECT_URL>/fix-out-variance.js',
        },
        range: {
          start: {
            line: 2,
            character: 20,
          },
          end: {
            line: 2,
            character: 21,
          },
        },
        context: {
          only: ['quickfix'],
          diagnostics: [],
        },
      }).verifyAllLSPMessagesInStep(
        [
          {
            method: 'textDocument/codeAction',
            result: [
              {
                title: 'Convert to `+`',
                kind: 'quickfix',
                diagnostics: [],
                edit: {
                  changes: {
                    '<PLACEHOLDER_PROJECT_URL>/fix-out-variance.js': [
                      {
                        range: {
                          start: {
                            line: 2,
                            character: 18,
                          },
                          end: {
                            line: 2,
                            character: 30,
                          },
                        },
                        newText: ': (<+A>() => A)',
                      },
                    ],
                  },
                },
                command: {
                  title: '',
                  command: 'log:org.flow:<PLACEHOLDER_PROJECT_URL>',
                  arguments: [
                    'textDocument/codeAction',
                    'convert_out_variance',
                    'Convert to `+`',
                  ],
                },
              },
            ],
          },
        ],
        ['textDocument/publishDiagnostics'],
      ),
    ]),
    test('provide quickfix for `in out` variance', [
      addFile('fix-in-out-variance.js.ignored', 'fix-in-out-variance.js'),
      lspStartAndConnect(),
      lspRequestAndWaitUntilResponse('textDocument/codeAction', {
        textDocument: {
          uri: '<PLACEHOLDER_PROJECT_URL>/fix-in-out-variance.js',
        },
        range: {
          start: {
            line: 2,
            character: 20,
          },
          end: {
            line: 2,
            character: 21,
          },
        },
        context: {
          only: ['quickfix'],
          diagnostics: [],
        },
      }).verifyAllLSPMessagesInStep(
        [
          {
            method: 'textDocument/codeAction',
            result: [
              {
                title: 'Remove',
                kind: 'quickfix',
                diagnostics: [],
                edit: {
                  changes: {
                    '<PLACEHOLDER_PROJECT_URL>/fix-in-out-variance.js': [
                      {
                        range: {
                          start: {
                            line: 2,
                            character: 18,
                          },
                          end: {
                            line: 2,
                            character: 34,
                          },
                        },
                        newText: ': (<A>(A) => A)',
                      },
                    ],
                  },
                },
                command: {
                  title: '',
                  command: 'log:org.flow:<PLACEHOLDER_PROJECT_URL>',
                  arguments: [
                    'textDocument/codeAction',
                    'remove_in_out_variance',
                    'Remove',
                  ],
                },
              },
            ],
          },
        ],
        ['textDocument/publishDiagnostics'],
      ),
    ]),
    test('provide quickfix for `as` type cast', [
      addFile('fix-as-expression.js.ignored', 'fix-as-expression.js'),
      lspStartAndConnect(),
      lspRequestAndWaitUntilResponse('textDocument/codeAction', {
        textDocument: {
          uri: '<PLACEHOLDER_PROJECT_URL>/fix-as-expression.js',
        },
        range: {
          start: {
            line: 2,
            character: 0,
          },
          end: {
            line: 2,
            character: 14,
          },
        },
        context: {
          only: ['quickfix'],
          diagnostics: [],
        },
      }).verifyAllLSPMessagesInStep(
        [
          {
            method: 'textDocument/codeAction',
            result: [
              {
                title: 'Convert to type cast `(<expr>: <type>)`',
                kind: 'quickfix',
                diagnostics: [],
                edit: {
                  changes: {
                    '<PLACEHOLDER_PROJECT_URL>/fix-as-expression.js': [
                      {
                        range: {
                          start: {
                            line: 2,
                            character: 0,
                          },
                          end: {
                            line: 2,
                            character: 14,
                          },
                        },
                        newText: '("foo": mixed)',
                      },
                    ],
                  },
                },
                command: {
                  title: '',
                  command: 'log:org.flow:<PLACEHOLDER_PROJECT_URL>',
                  arguments: [
                    'textDocument/codeAction',
                    'convert_as_expression',
                    'Convert to type cast `(<expr>: <type>)`',
                  ],
                },
              },
            ],
          },
        ],
        ['textDocument/publishDiagnostics'],
      ),
    ]),
    test('provide quickfix for `satisfies` type cast', [
      addFile(
        'fix-satisfies-expression.js.ignored',
        'fix-satisfies-expression.js',
      ),
      lspStartAndConnect(),
      lspRequestAndWaitUntilResponse('textDocument/codeAction', {
        textDocument: {
          uri: '<PLACEHOLDER_PROJECT_URL>/fix-satisfies-expression.js',
        },
        range: {
          start: {
            line: 2,
            character: 0,
          },
          end: {
            line: 2,
            character: 21,
          },
        },
        context: {
          only: ['quickfix'],
          diagnostics: [],
        },
      }).verifyAllLSPMessagesInStep(
        [
          {
            method: 'textDocument/codeAction',
            result: [
              {
                title: 'Convert to type cast `(<expr>: <type>)`',
                kind: 'quickfix',
                diagnostics: [],
                edit: {
                  changes: {
                    '<PLACEHOLDER_PROJECT_URL>/fix-satisfies-expression.js': [
                      {
                        range: {
                          start: {
                            line: 2,
                            character: 0,
                          },
                          end: {
                            line: 2,
                            character: 21,
                          },
                        },
                        newText: '("foo": mixed)',
                      },
                    ],
                  },
                },
                command: {
                  title: '',
                  command: 'log:org.flow:<PLACEHOLDER_PROJECT_URL>',
                  arguments: [
                    'textDocument/codeAction',
                    'convert_satisfies_expression',
                    'Convert to type cast `(<expr>: <type>)`',
                  ],
                },
              },
            ],
          },
        ],
        ['textDocument/publishDiagnostics'],
      ),
    ]),
    test('provide quickfix for `readonly` array type', [
      addFile(
        'fix-readonly-array-type.js.ignored',
        'fix-readonly-array-type.js',
      ),
      lspStartAndConnect(),
      lspRequestAndWaitUntilResponse('textDocument/codeAction', {
        textDocument: {
          uri: '<PLACEHOLDER_PROJECT_URL>/fix-readonly-array-type.js',
        },
        range: {
          start: {
            line: 2,
            character: 10,
          },
          end: {
            line: 2,
            character: 26,
          },
        },
        context: {
          only: ['quickfix'],
          diagnostics: [],
        },
      }).verifyAllLSPMessagesInStep(
        [
          {
            method: 'textDocument/codeAction',
            result: [
              {
                title: 'Convert to `$ReadOnlyArray`',
                kind: 'quickfix',
                diagnostics: [],
                edit: {
                  changes: {
                    '<PLACEHOLDER_PROJECT_URL>/fix-readonly-array-type.js': [
                      {
                        range: {
                          start: {
                            line: 2,
                            character: 9,
                          },
                          end: {
                            line: 2,
                            character: 26,
                          },
                        },
                        newText: '$ReadOnlyArray<string>',
                      },
                    ],
                  },
                },
                command: {
                  title: '',
                  command: 'log:org.flow:<PLACEHOLDER_PROJECT_URL>',
                  arguments: [
                    'textDocument/codeAction',
                    'convert_readonly_array_type',
                    'Convert to `$ReadOnlyArray`',
                  ],
                },
              },
            ],
          },
        ],
        ['textDocument/publishDiagnostics'],
      ),
    ]),
    test('provide quickfix for `readonly` tuple type', [
      addFile(
        'fix-readonly-tuple-type.js.ignored',
        'fix-readonly-tuple-type.js',
      ),
      lspStartAndConnect(),
      lspRequestAndWaitUntilResponse('textDocument/codeAction', {
        textDocument: {
          uri: '<PLACEHOLDER_PROJECT_URL>/fix-readonly-tuple-type.js',
        },
        range: {
          start: {
            line: 2,
            character: 10,
          },
          end: {
            line: 2,
            character: 34,
          },
        },
        context: {
          only: ['quickfix'],
          diagnostics: [],
        },
      }).verifyAllLSPMessagesInStep(
        [
          {
            method: 'textDocument/codeAction',
            result: [
              {
                title: 'Convert to `$ReadOnly`',
                kind: 'quickfix',
                diagnostics: [],
                edit: {
                  changes: {
                    '<PLACEHOLDER_PROJECT_URL>/fix-readonly-tuple-type.js': [
                      {
                        range: {
                          start: {
                            line: 2,
                            character: 9,
                          },
                          end: {
                            line: 2,
                            character: 34,
                          },
                        },
                        newText: '$ReadOnly<[string, number]>',
                      },
                    ],
                  },
                },
                command: {
                  title: '',
                  command: 'log:org.flow:<PLACEHOLDER_PROJECT_URL>',
                  arguments: [
                    'textDocument/codeAction',
                    'convert_readonly_tuple_type',
                    'Convert to `$ReadOnly`',
                  ],
                },
              },
            ],
          },
        ],
        ['textDocument/publishDiagnostics'],
      ),
    ]),
    test('provide quickfix for `Readonly` type', [
      addFile('fix-readonly-type.js.ignored', 'fix-readonly-type.js'),
      lspStartAndConnect(),
      lspRequestAndWaitUntilResponse('textDocument/codeAction', {
        textDocument: {
          uri: '<PLACEHOLDER_PROJECT_URL>/fix-readonly-type.js',
        },
        range: {
          start: {
            line: 1,
            character: 9,
          },
          end: {
            line: 1,
            character: 17,
          },
        },
        context: {
          only: ['quickfix'],
          diagnostics: [],
        },
      }).verifyAllLSPMessagesInStep(
        [
          {
            method: 'textDocument/codeAction',
            result: [
              {
                title: 'Convert to `$ReadOnly`',
                kind: 'quickfix',
                diagnostics: [],
                edit: {
                  changes: {
                    '<PLACEHOLDER_PROJECT_URL>/fix-readonly-type.js': [
                      {
                        range: {
                          start: {
                            line: 1,
                            character: 9,
                          },
                          end: {
                            line: 1,
                            character: 17,
                          },
                        },
                        newText: '$ReadOnly',
                      },
                    ],
                  },
                },
                command: {
                  title: '',
                  command: 'log:org.flow:<PLACEHOLDER_PROJECT_URL>',
                  arguments: [
                    'textDocument/codeAction',
                    'convert_Readonly_type',
                    'Convert to `$ReadOnly`',
                  ],
                },
              },
            ],
          },
        ],
        ['textDocument/publishDiagnostics'],
      ),
    ]),
    test('provide quickfix for `ReadonlyArray` type', [
      addFile('fix-readonlyarray-type.js.ignored', 'fix-readonlyarray-type.js'),
      lspStartAndConnect(),
      lspRequestAndWaitUntilResponse('textDocument/codeAction', {
        textDocument: {
          uri: '<PLACEHOLDER_PROJECT_URL>/fix-readonlyarray-type.js',
        },
        range: {
          start: {
            line: 1,
            character: 9,
          },
          end: {
            line: 1,
            character: 22,
          },
        },
        context: {
          only: ['quickfix'],
          diagnostics: [],
        },
      }).verifyAllLSPMessagesInStep(
        [
          {
            method: 'textDocument/codeAction',
            result: [
              {
                title: 'Convert to `$ReadOnlyArray`',
                kind: 'quickfix',
                diagnostics: [],
                edit: {
                  changes: {
                    '<PLACEHOLDER_PROJECT_URL>/fix-readonlyarray-type.js': [
                      {
                        range: {
                          start: {
                            line: 1,
                            character: 9,
                          },
                          end: {
                            line: 1,
                            character: 22,
                          },
                        },
                        newText: '$ReadOnlyArray',
                      },
                    ],
                  },
                },
                command: {
                  title: '',
                  command: 'log:org.flow:<PLACEHOLDER_PROJECT_URL>',
                  arguments: [
                    'textDocument/codeAction',
                    'convert_ReadonlyArray_type',
                    'Convert to `$ReadOnlyArray`',
                  ],
                },
              },
            ],
          },
        ],
        ['textDocument/publishDiagnostics'],
      ),
    ]),
    test('provide quickfix for `ReadonlyMap` type', [
      addFile('fix-readonlymap-type.js.ignored', 'fix-readonlymap-type.js'),
      lspStartAndConnect(),
      lspRequestAndWaitUntilResponse('textDocument/codeAction', {
        textDocument: {
          uri: '<PLACEHOLDER_PROJECT_URL>/fix-readonlymap-type.js',
        },
        range: {
          start: {
            line: 1,
            character: 9,
          },
          end: {
            line: 1,
            character: 20,
          },
        },
        context: {
          only: ['quickfix'],
          diagnostics: [],
        },
      }).verifyAllLSPMessagesInStep(
        [
          {
            method: 'textDocument/codeAction',
            result: [
              {
                title: 'Convert to `$ReadOnlyMap`',
                kind: 'quickfix',
                diagnostics: [],
                edit: {
                  changes: {
                    '<PLACEHOLDER_PROJECT_URL>/fix-readonlymap-type.js': [
                      {
                        range: {
                          start: {
                            line: 1,
                            character: 9,
                          },
                          end: {
                            line: 1,
                            character: 20,
                          },
                        },
                        newText: '$ReadOnlyMap',
                      },
                    ],
                  },
                },
                command: {
                  title: '',
                  command: 'log:org.flow:<PLACEHOLDER_PROJECT_URL>',
                  arguments: [
                    'textDocument/codeAction',
                    'convert_ReadonlyMap_type',
                    'Convert to `$ReadOnlyMap`',
                  ],
                },
              },
            ],
          },
        ],
        ['textDocument/publishDiagnostics'],
      ),
    ]),
    test('provide quickfix for `ReadonlySet` type', [
      addFile('fix-readonlyset-type.js.ignored', 'fix-readonlyset-type.js'),
      lspStartAndConnect(),
      lspRequestAndWaitUntilResponse('textDocument/codeAction', {
        textDocument: {
          uri: '<PLACEHOLDER_PROJECT_URL>/fix-readonlyset-type.js',
        },
        range: {
          start: {
            line: 1,
            character: 9,
          },
          end: {
            line: 1,
            character: 20,
          },
        },
        context: {
          only: ['quickfix'],
          diagnostics: [],
        },
      }).verifyAllLSPMessagesInStep(
        [
          {
            method: 'textDocument/codeAction',
            result: [
              {
                title: 'Convert to `$ReadOnlySet`',
                kind: 'quickfix',
                diagnostics: [],
                edit: {
                  changes: {
                    '<PLACEHOLDER_PROJECT_URL>/fix-readonlyset-type.js': [
                      {
                        range: {
                          start: {
                            line: 1,
                            character: 9,
                          },
                          end: {
                            line: 1,
                            character: 20,
                          },
                        },
                        newText: '$ReadOnlySet',
                      },
                    ],
                  },
                },
                command: {
                  title: '',
                  command: 'log:org.flow:<PLACEHOLDER_PROJECT_URL>',
                  arguments: [
                    'textDocument/codeAction',
                    'convert_ReadonlySet_type',
                    'Convert to `$ReadOnlySet`',
                  ],
                },
              },
            ],
          },
        ],
        ['textDocument/publishDiagnostics'],
      ),
    ]),
    test('provide quickfix for `NonNullable` type', [
      addFile('fix-nonnullable-type.js.ignored', 'fix-nonnullable-type.js'),
      lspStartAndConnect(),
      lspRequestAndWaitUntilResponse('textDocument/codeAction', {
        textDocument: {
          uri: '<PLACEHOLDER_PROJECT_URL>/fix-nonnullable-type.js',
        },
        range: {
          start: {
            line: 1,
            character: 9,
          },
          end: {
            line: 1,
            character: 20,
          },
        },
        context: {
          only: ['quickfix'],
          diagnostics: [],
        },
      }).verifyAllLSPMessagesInStep(
        [
          {
            method: 'textDocument/codeAction',
            result: [
              {
                title: 'Convert to `$NonMaybeType`',
                kind: 'quickfix',
                diagnostics: [],
                edit: {
                  changes: {
                    '<PLACEHOLDER_PROJECT_URL>/fix-nonnullable-type.js': [
                      {
                        range: {
                          start: {
                            line: 1,
                            character: 9,
                          },
                          end: {
                            line: 1,
                            character: 20,
                          },
                        },
                        newText: '$NonMaybeType',
                      },
                    ],
                  },
                },
                command: {
                  title: '',
                  command: 'log:org.flow:<PLACEHOLDER_PROJECT_URL>',
                  arguments: [
                    'textDocument/codeAction',
                    'convert_NonNullable_type',
                    'Convert to `$NonMaybeType`',
                  ],
                },
              },
            ],
          },
        ],
        ['textDocument/publishDiagnostics'],
      ),
    ]),
    test('provide codeAction for inserting jsdocs', [
      addFile('insert-jsdoc.js.ignored', 'insert-jsdoc.js'),
      lspStartAndConnect(),
      lspRequestAndWaitUntilResponse('textDocument/codeAction', {
        textDocument: {
          uri: '<PLACEHOLDER_PROJECT_URL>/insert-jsdoc.js',
        },
        range: {
          start: {
            line: 3,
            character: 10,
          },
          end: {
            line: 3,
            character: 10,
          },
        },
        context: {
          only: ['refactor'],
          diagnostics: [],
        },
      }).verifyAllLSPMessagesInStep(
        [
          {
            method: 'textDocument/codeAction',
            result: [
              {
                title: 'Add JSDoc documentation',
                kind: 'refactor',
                diagnostics: [],
                edit: {
                  changes: {
                    '<PLACEHOLDER_PROJECT_URL>/insert-jsdoc.js': [
                      {
                        range: {
                          start: {
                            line: 3,
                            character: 0,
                          },
                          end: {
                            line: 3,
                            character: 0,
                          },
                        },
                        newText:
                          '/**\n * $0\n * @param x \n * @param y \n */\n',
                      },
                    ],
                  },
                },
              },
            ],
          },
        ],
        ['textDocument/publishDiagnostics'],
      ),
      lspRequestAndWaitUntilResponse('textDocument/codeAction', {
        textDocument: {
          uri: '<PLACEHOLDER_PROJECT_URL>/insert-jsdoc.js',
        },
        range: {
          start: {
            line: 8,
            character: 18,
          },
          end: {
            line: 8,
            character: 18,
          },
        },
        context: {
          only: ['refactor'],
          diagnostics: [],
        },
      }).verifyAllLSPMessagesInStep(
        [
          {
            method: 'textDocument/codeAction',
            result: [
              {
                title: 'Add JSDoc documentation',
                kind: 'refactor',
                diagnostics: [],
                edit: {
                  changes: {
                    '<PLACEHOLDER_PROJECT_URL>/insert-jsdoc.js': [
                      {
                        range: {
                          start: {
                            line: 8,
                            character: 0,
                          },
                          end: {
                            line: 8,
                            character: 0,
                          },
                        },
                        newText:
                          '/**\n * $0\n * @param x \n * @param y \n */\n',
                      },
                    ],
                  },
                },
              },
            ],
          },
        ],
        ['textDocument/publishDiagnostics'],
      ),
      lspRequestAndWaitUntilResponse('textDocument/codeAction', {
        textDocument: {
          uri: '<PLACEHOLDER_PROJECT_URL>/insert-jsdoc.js',
        },
        range: {
          start: {
            line: 11,
            character: 18,
          },
          end: {
            line: 11,
            character: 18,
          },
        },
        context: {
          only: ['refactor'],
          diagnostics: [],
        },
      }).verifyAllLSPMessagesInStep(
        [
          {
            method: 'textDocument/codeAction',
            result: [
              {
                title: 'Add JSDoc documentation',
                kind: 'refactor',
                diagnostics: [],
                edit: {
                  changes: {
                    '<PLACEHOLDER_PROJECT_URL>/insert-jsdoc.js': [
                      {
                        range: {
                          start: {
                            line: 11,
                            character: 0,
                          },
                          end: {
                            line: 11,
                            character: 0,
                          },
                        },
                        newText: '/**\n * $0\n */\n',
                      },
                    ],
                  },
                },
              },
            ],
          },
        ],
        ['textDocument/publishDiagnostics'],
      ),
    ]),
    test('provide codeAction for refactoring arrow functions', [
      addFile(
        'refactor-arrow-functions.js.ignored',
        'refactor-arrow-functions.js',
      ),
      lspStartAndConnect(),
      lspRequestAndWaitUntilResponse('textDocument/codeAction', {
        textDocument: {
          uri: '<PLACEHOLDER_PROJECT_URL>/refactor-arrow-functions.js',
        },
        range: {
          start: {
            line: 4,
            character: 10,
          },
          end: {
            line: 4,
            character: 10,
          },
        },
        context: {
          only: ['refactor'],
          diagnostics: [],
        },
      }).verifyAllLSPMessagesInStep(
        [
          {
            method: 'textDocument/codeAction',
            result: [
              {
                title: 'Add braces to arrow function',
                kind: 'refactor.rewrite',
                diagnostics: [],
                edit: {
                  changes: {
                    '<PLACEHOLDER_PROJECT_URL>/refactor-arrow-functions.js': [
                      {
                        range: {
                          start: {
                            line: 4,
                            character: 4,
                          },
                          end: {
                            line: 4,
                            character: 15,
                          },
                        },
                        newText: '() => {\n  return "foo";\n}',
                      },
                    ],
                  },
                },
              },
            ],
          },
        ],
        ['textDocument/publishDiagnostics'],
      ),
      lspRequestAndWaitUntilResponse('textDocument/codeAction', {
        textDocument: {
          uri: '<PLACEHOLDER_PROJECT_URL>/refactor-arrow-functions.js',
        },
        range: {
          start: {
            line: 7,
            character: 5,
          },
          end: {
            line: 7,
            character: 5,
          },
        },
        context: {
          only: ['refactor'],
          diagnostics: [],
        },
      }).verifyAllLSPMessagesInStep(
        [
          {
            method: 'textDocument/codeAction',
            result: [
              {
                title: 'Remove braces from arrow function',
                kind: 'refactor.rewrite',
                diagnostics: [],
                edit: {
                  changes: {
                    '<PLACEHOLDER_PROJECT_URL>/refactor-arrow-functions.js': [
                      {
                        range: {
                          start: {
                            line: 6,
                            character: 4,
                          },
                          end: {
                            line: 8,
                            character: 1,
                          },
                        },
                        newText: '() => "foo"',
                      },
                    ],
                  },
                },
              },
            ],
          },
        ],
        ['textDocument/publishDiagnostics'],
      ),
    ]),
    test('provide quickfix for `$Partial`', [
      addFile('fix-partial-type.js.ignored', 'fix-partial-type.js'),
      lspStartAndConnect(),
      lspRequestAndWaitUntilResponse('textDocument/codeAction', {
        textDocument: {
          uri: '<PLACEHOLDER_PROJECT_URL>/fix-partial-type.js',
        },
        range: {
          start: {
            line: 1,
            character: 9,
          },
          end: {
            line: 1,
            character: 17,
          },
        },
        context: {
          only: ['quickfix'],
          diagnostics: [],
        },
      }).verifyAllLSPMessagesInStep(
        [
          {
            method: 'textDocument/codeAction',
            result: [
              {
                title: 'Convert to `Partial`',
                kind: 'quickfix',
                diagnostics: [],
                edit: {
                  changes: {
                    '<PLACEHOLDER_PROJECT_URL>/fix-partial-type.js': [
                      {
                        range: {
                          start: {
                            line: 1,
                            character: 9,
                          },
                          end: {
                            line: 1,
                            character: 17,
                          },
                        },
                        newText: 'Partial',
                      },
                    ],
                  },
                },
                command: {
                  title: '',
                  command: 'log:org.flow:<PLACEHOLDER_PROJECT_URL>',
                  arguments: [
                    'textDocument/codeAction',
                    'convert_$Partial_type',
                    'Convert to `Partial`',
                  ],
                },
              },
            ],
          },
        ],
        ['textDocument/publishDiagnostics'],
      ),
    ]),
    test('provide quickfix for `$Shape`', [
      addFile('fix-shape-type.js.ignored', 'fix-shape-type.js'),
      lspStartAndConnect(),
      lspRequestAndWaitUntilResponse('textDocument/codeAction', {
        textDocument: {
          uri: '<PLACEHOLDER_PROJECT_URL>/fix-shape-type.js',
        },
        range: {
          start: {
            line: 1,
            character: 9,
          },
          end: {
            line: 1,
            character: 15,
          },
        },
        context: {
          only: ['quickfix'],
          diagnostics: [],
        },
      }).verifyAllLSPMessagesInStep(
        [
          {
            method: 'textDocument/codeAction',
            result: [
              {
                title: 'Convert to `Partial`',
                kind: 'quickfix',
                diagnostics: [],
                edit: {
                  changes: {
                    '<PLACEHOLDER_PROJECT_URL>/fix-shape-type.js': [
                      {
                        range: {
                          start: {
                            line: 1,
                            character: 9,
                          },
                          end: {
                            line: 1,
                            character: 15,
                          },
                        },
                        newText: 'Partial',
                      },
                    ],
                  },
                },
                command: {
                  title: '',
                  command: 'log:org.flow:<PLACEHOLDER_PROJECT_URL>',
                  arguments: [
                    'textDocument/codeAction',
                    'convert_$Shape_type',
                    'Convert to `Partial`',
                  ],
                },
              },
            ],
          },
        ],
        ['textDocument/publishDiagnostics'],
      ),
    ]),
    test('provide quickfix for class member access', [
      addFile(
        'fix-class-member-access.js.ignored',
        'fix-class-member-access.js',
      ),
      lspStartAndConnect(),
      lspRequestAndWaitUntilResponse('textDocument/codeAction', {
        textDocument: {
          uri: '<PLACEHOLDER_PROJECT_URL>/fix-class-member-access.js',
        },
        range: {
          start: {
            line: 8,
            character: 7,
          },
          end: {
            line: 8,
            character: 7,
          },
        },
        context: {
          only: ['quickfix'],
          diagnostics: [],
        },
      }).verifyAllLSPMessagesInStep(
        [
          {
            method: 'textDocument/codeAction',
            result: [
              {
                title: 'Prefix with `this.`',
                kind: 'quickfix',
                diagnostics: [],
                edit: {
                  changes: {
                    '<PLACEHOLDER_PROJECT_URL>/fix-class-member-access.js': [
                      {
                        range: {
                          start: {
                            line: 8,
                            character: 4,
                          },
                          end: {
                            line: 8,
                            character: 9,
                          },
                        },
                        newText: 'this.field',
                      },
                    ],
                  },
                },
                command: {
                  title: '',
                  command: 'log:org.flow:<PLACEHOLDER_PROJECT_URL>',
                  arguments: [
                    'textDocument/codeAction',
                    'prefix_with_this',
                    'Prefix with `this.`',
                  ],
                },
              },
            ],
          },
        ],
        ['textDocument/publishDiagnostics'],
      ),
      lspRequestAndWaitUntilResponse('textDocument/codeAction', {
        textDocument: {
          uri: '<PLACEHOLDER_PROJECT_URL>/fix-class-member-access.js',
        },
        range: {
          start: {
            line: 10,
            character: 7,
          },
          end: {
            line: 10,
            character: 7,
          },
        },
        context: {
          only: ['quickfix'],
          diagnostics: [],
        },
      }).verifyAllLSPMessagesInStep(
        [
          {
            method: 'textDocument/codeAction',
            result: [
              {
                title: 'Prefix with `this.`',
                kind: 'quickfix',
                diagnostics: [],
                edit: {
                  changes: {
                    '<PLACEHOLDER_PROJECT_URL>/fix-class-member-access.js': [
                      {
                        range: {
                          start: {
                            line: 10,
                            character: 4,
                          },
                          end: {
                            line: 10,
                            character: 10,
                          },
                        },
                        newText: '(this.method)',
                      },
                    ],
                  },
                },
                command: {
                  title: '',
                  command: 'log:org.flow:<PLACEHOLDER_PROJECT_URL>',
                  arguments: [
                    'textDocument/codeAction',
                    'prefix_with_this',
                    'Prefix with `this.`',
                  ],
                },
              },
            ],
          },
        ],
        ['textDocument/publishDiagnostics'],
      ),
      lspRequestAndWaitUntilResponse('textDocument/codeAction', {
        textDocument: {
          uri: '<PLACEHOLDER_PROJECT_URL>/fix-class-member-access.js',
        },
        range: {
          start: {
            line: 12,
            character: 7,
          },
          end: {
            line: 12,
            character: 7,
          },
        },
        context: {
          only: ['quickfix'],
          diagnostics: [],
        },
      }).verifyAllLSPMessagesInStep(
        [
          {
            method: 'textDocument/codeAction',
            result: [],
          },
        ],
        ['textDocument/publishDiagnostics'],
      ),
    ]),
  ],
): Suite);
