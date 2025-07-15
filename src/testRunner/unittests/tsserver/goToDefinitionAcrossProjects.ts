import { protocol } from "../../_namespaces/ts.server.js";
import {
    baselineTsserverLogs,
    TestSession,
} from "../helpers/tsserver.js";
import {
    File,
    TestServerHost,
} from "../helpers/virtualFileSystemWithWatch.js";

/**
 * Scenario: The same source file belongs to *two* configured projects, each of which
 * declares its own augmentation of an interface `Thing`.  When the file is opened
 * and the user requests `go-to definition` on the identifier `Thing`, the server
 * should return *both* interface declarations when the new
 * `mergeDefinitionsAcrossProjects` preference flag is enabled.
 */

describe("unittests:: tsserver:: services:: goToDefinitionAcrossProjects::", () => {
    it("merges definition results across all containing projects when the preference flag is on", () => {
        // File layout:
        //  /user/username/projects/shared/shared.ts            <-- opened file
        //  /user/username/projects/project1/tsconfig.json
        //  /user/username/projects/project1/thingA.ts          (interface Thing { a: string })
        //  /user/username/projects/project2/tsconfig.json
        //  /user/username/projects/project2/thingB.ts          (interface Thing { b: number })

        const shared: File = {
            path: "/user/username/projects/shared/shared.ts",
            content: `let x: Thing;\n        x; // reference to Thing`,
        };
        const thingA: File = {
            path: "/user/username/projects/project1/thingA.ts",
            content: `interface Thing { a: string }`,
        };
        const thingB: File = {
            path: "/user/username/projects/project2/thingB.ts",
            content: `interface Thing { b: number }`,
        };
        const config1: File = {
            path: "/user/username/projects/project1/tsconfig.json",
            content: JSON.stringify({
                compilerOptions: {},
                files: ["../shared/shared.ts", "./thingA.ts"],
            }),
        };
        const config2: File = {
            path: "/user/username/projects/project2/tsconfig.json",
            content: JSON.stringify({
                compilerOptions: {},
                files: ["../shared/shared.ts", "./thingB.ts"],
            }),
        };

        const host = TestServerHost.createServerHost([
            shared,
            thingA,
            thingB,
            config1,
            config2,
        ]);
        const session = new TestSession(host);

        // Open the shared file (belongs to two projects)
        session.executeCommandSeq<protocol.UpdateOpenRequest>({
            command: protocol.CommandTypes.UpdateOpen,
            arguments: {
                openFiles: [
                    {
                        file: shared.path,
                        fileContent: shared.content,
                    },
                    {
                        file: thingA.path,
                        fileContent: thingA.content,
                    },
                    {
                        file: thingB.path,
                        fileContent: thingB.content,
                    },
                ],
            },
        });

        // Enable the experimental merge flag through a 'configure' request
        session.executeCommandSeq<protocol.ConfigureRequest>({
            command: protocol.CommandTypes.Configure,
            arguments: {
                preferences: { mergeDefinitionsAcrossProjects: true },
            },
        });

        // Ask for go-to definition on identifier `Thing` (line 1, column 10)
        session.executeCommandSeq<protocol.DefinitionRequest>({
            command: protocol.CommandTypes.Definition,
            arguments: {
                file: shared.path,
                line: 1,
                offset: 10, // position of 'T' in 'Thing'
            },
        });
        session.executeCommandSeq<protocol.DefinitionAndBoundSpanRequest>({
            command: protocol.CommandTypes.DefinitionAndBoundSpan,
            arguments: {
                file: shared.path,
                line: 1,
                offset: 10, // position of 'T' in 'Thing'
            },
        });

        baselineTsserverLogs(
            "goToDefinitionAcrossProjects",
            "merges definitions across projects when preference flag is on",
            session,
        );
    });
    it("does not merge definition results across all containing projects when the preference flag is off", () => {
        // File layout:
        //  /user/username/projects/shared/shared.ts            <-- opened file
        //  /user/username/projects/project1/tsconfig.json
        //  /user/username/projects/project1/thingA.ts          (interface Thing { a: string })
        //  /user/username/projects/project2/tsconfig.json
        //  /user/username/projects/project2/thingB.ts          (interface Thing { b: number })

        const shared: File = {
            path: "/user/username/projects/shared/shared.ts",
            content: `let x: Thing;\n        x; // reference to Thing`,
        };
        const thingA: File = {
            path: "/user/username/projects/project1/thingA.ts",
            content: `interface Thing { a: string }`,
        };
        const thingB: File = {
            path: "/user/username/projects/project2/thingB.ts",
            content: `interface Thing { b: number }`,
        };
        const config1: File = {
            path: "/user/username/projects/project1/tsconfig.json",
            content: JSON.stringify({
                compilerOptions: {},
                files: ["../shared/shared.ts", "./thingA.ts"],
            }),
        };
        const config2: File = {
            path: "/user/username/projects/project2/tsconfig.json",
            content: JSON.stringify({
                compilerOptions: {},
                files: ["../shared/shared.ts", "./thingB.ts"],
            }),
        };

        const host = TestServerHost.createServerHost([
            shared,
            thingA,
            thingB,
            config1,
            config2,
        ]);
        const session = new TestSession(host);

        // Open the shared file (belongs to two projects)
        session.executeCommandSeq<protocol.UpdateOpenRequest>({
            command: protocol.CommandTypes.UpdateOpen,
            arguments: {
                openFiles: [
                    {
                        file: shared.path,
                        fileContent: shared.content,
                    },
                    {
                        file: thingA.path,
                        fileContent: thingA.content,
                    },
                    {
                        file: thingB.path,
                        fileContent: thingB.content,
                    },
                ],
            },
        });

        // Enable the experimental merge flag through a 'configure' request
        session.executeCommandSeq<protocol.ConfigureRequest>({
            command: protocol.CommandTypes.Configure,
            arguments: {
                preferences: { mergeDefinitionsAcrossProjects: false },
            },
        });

        // Ask for go-to definition on identifier `Thing` (line 1, column 10)
        session.executeCommandSeq<protocol.DefinitionRequest>({
            command: protocol.CommandTypes.Definition,
            arguments: {
                file: shared.path,
                line: 1,
                offset: 10, // position of 'T' in 'Thing'
            },
        });
        session.executeCommandSeq<protocol.DefinitionAndBoundSpanRequest>({
            command: protocol.CommandTypes.DefinitionAndBoundSpan,
            arguments: {
                file: shared.path,
                line: 1,
                offset: 10, // position of 'T' in 'Thing'
            },
        });

        baselineTsserverLogs(
            "goToDefinitionAcrossProjects",
            "does not merge definitions across projects when preference flag is off",
            session,
        );
    });
});
