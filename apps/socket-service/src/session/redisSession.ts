import Redis from 'ioredis'

class SessionStore {
    findSession(id: string) { }
    deleteSession(id: string) { }
    saveSession(session: ISession) { }
    findAllSessions() { }
}

class SessionService extends SessionStore {
    private redisClient

    constructor() {
        super()
        this.redisClient = new Redis();
    }

    saveSession(session: ISession) {
        if (!session) return

        const keyvals: string[] = ObjToKeyValArray(session);

        return this.redisClient
            .multi()
            .hset(`session:${session.id}`, keyvals)
            // .expire(`session:${session.id}`, SESSION_TTL)
            .exec();
    }

    async findAllSessions(): Promise<ISession[]> {
        const keys = await this.getAllSessionKeys();

        const commands: unknown[][] = [];

        keys.forEach((key) => {
            commands.push(["hgetall", key]);
        });

        return this.redisClient
            .multi(commands)
            .exec()
            .then((results) =>
                results?.map(([err, session]: any) => {
                    if (err) throw err
                    return parseObjValue(session) as ISession
                }).filter(v => v !== null)!
            )
    }

    async findSession(id: string) {
        return await this.redisClient
            .hgetall(`session:${id}`)
            .then((record) => parseObjValue(record)) as ISession
    }

    async findSessionByUserId(id: string) {
        const sessions = await this.findAllSessions()
        return sessions?.find(session => {
            if (!session) return null
            return session.userId === id
        })
        // .hexists(`session:${id}`,)
        // .then((record) => parseObjValue(record)) as ISession
    }

    private async getAllSessionKeys() {
        const keys = new Set<string>()
        let nextIndex = 0;

        do {
            const [nextIndexAsStr, results] = await this.redisClient.scan(
                nextIndex,
                "MATCH",
                "session:*",
                "COUNT",
                "100"
            );
            nextIndex = parseInt(nextIndexAsStr, 10);
            results.forEach((s) => keys.add(s));
        } while (nextIndex !== 0);
        return keys;
    }
}

export default SessionService

function parseObjValue(record: Record<string, string>) {
    const keys = Object.keys(record);
    return keys.reduce((ini, curr) => {
        const key = curr as keyof typeof record;
        const value = JSON.parse(record[key]);

        Object.assign(ini, { [key]: value });
        return ini;
    }, {});
}

function ObjToKeyValArray(session: ISession) {
    const array: any = [];

    Object
        .keys(session)
        .forEach(item => {
            const key = item as keyof typeof session;
            const value = JSON.stringify(session[key as keyof typeof session]);
            array.push(item, value);
        });
    return array;
}

