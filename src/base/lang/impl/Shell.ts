

export namespace Shell {
    export const UnixAndShell = Object.freeze(<const>[
        // "uname", "users", "whoami", "df", "du", "uptime",
        // "date", "cal",
        "env", "chroot", "fg", "bg", "ps", "jobs", "kill",
        "source", "test", /* "timeout", "yes", */ "time",
        "echo", "printf",

        "cd", "pwd",
        "ls", /* "dirname", */ "find", "grep",
        "mkdir", "rm", "mv", "cp", "chmod", "ln", "touch",

        "cat", "tac", "head", "tail", "nl", "od",
        "more", "less",
        // "cut", "paste", "expand", "unexpand", "fold",
        "sort", "uniq",
        "cksum", "wc",
        "awk", "sed",
    ]);
    export const Other = Object.freeze(<const>[
    ]);
    export const Git = Object.freeze(<const>[
        "init", "fetch", "merge", "push",
        "status", "diff", "add", "restore", "commit",
        "switch", "branch", "worktree",
        "gc", "fsck", "prune",
        "log",
    ]);
}