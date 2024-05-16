export interface Manifest {
    title: string
    description: string
    version: string
    descriptor: string
    author: string
    source: string // git repository url
}

export interface GameServerStatus {
    installed: Array<Manifest>
}
