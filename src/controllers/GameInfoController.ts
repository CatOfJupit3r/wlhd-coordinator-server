import { Request, Response } from 'express';
import { GameInfoService } from '../services/GameInfoService';
import { Cache } from '../utils/Cache';
import {GameState} from "../models/GameState";

export class GameInfoController {

    private gameInfoService: GameInfoService;
    private staticCommands: string[] = ["message"];
    private dynamicCommands: string[] = ["state", "field", "options"];

    private staticCache: Map<string, Cache>;
    private dynamicCache: Map<string, Cache>;
    private processingDynamic: Map<string, Set<string>>;
    private processingStatic: Map<string, Set<string>>;

    constructor() {
        this.gameInfoService = new GameInfoService();
        this.dynamicCache = new Map();
        this.staticCache = new Map();
        this.processingDynamic = new Map();
        this.processingStatic = new Map();

        const populate = (iter: string[], obj: Map<string, Cache> | Map<string, Set<string>>, innerObjConstructor: any) => {
            iter.forEach((command: string) => {
                obj.set(command, new innerObjConstructor());
            });
        }
        populate(this.dynamicCommands, this.dynamicCache, Cache);
        populate(this.staticCommands, this.staticCache, Cache);
        populate(this.dynamicCommands, this.processingDynamic, Set);
        populate(this.staticCommands, this.processingStatic, Set);
    }

    public clearDynamicCache(game_id: string): void {
        this.dynamicCache.forEach(cached => {
            cached.pop(game_id);
        });
        this.processingDynamic.forEach((set) => {
            set.delete(game_id);
        })
        return;
    }

    public getGameState(req: Request, res: Response): void {
        const { game_id } = req.params;
        if (!game_id) {
            res.status(400).send('Missing game_id');
            return;
        }
        if (this.dynamicCache.get(game_id)) {
            res.json(this.dynamicCache.get(game_id));
            return;
        } else if (this.processingDynamic.has(game_id)) {
            while (!this.dynamicCache.get(game_id)) {
                setTimeout(() => {}, 2000);
            }
            res.json(this.dynamicCache.get(game_id));
            return;
        }
        this.processingDynamic.get("state")?.add(game_id);
        this.gameInfoService.getGameState(game_id)
            .then((gameState: GameState) => {
                this.dynamicCache.get("state")?.set(game_id, gameState);
                res.json(gameState);
            })
            .catch((error: any) => {
                res.status(500).send(error);
            })
            .finally(() => {
                this.processingDynamic.delete(game_id);
            });
    }

    private checkCache(game_id: string, command: string, res: Response): boolean {
        if (this.staticCache.get(command)?.get(game_id)) {
            res.json(this.staticCache.get(command)?.get(game_id));
            return true;
        } else if (this.processingStatic.get(command)?.has(game_id)) {
            while (!this.staticCache.get(command)?.get(game_id)) {
                setTimeout(() => {}, 2000);
            }
            res.json(this.staticCache.get(command)?.get(game_id));
            return true;
        }
        return false;
    }

    public getGameField(req: Request, res: Response): void {
        const { game_id } = req.params;
        if (!game_id) {
            res.status(400).send('Missing game_id');
            return;
        }
        if (this.checkCache(game_id, "field", res)) {
            return
        }
        this.processingDynamic.get("field")?.add(game_id);
        this.gameInfoService.getGameField(game_id)
            .then((gameField: any) => {
                this.dynamicCache.get("field")?.set(game_id, gameField);
                res.json(gameField);
            })
            .catch((error: any) => {
                res.status(500).send(error);
            })
            .finally(() => {
                this.processingDynamic.delete(game_id);
            });
    }

    public getActionOptions(req: Request, res: Response): void {
        const { game_id, entity_id } = req.params;
        if (!game_id || !entity_id) {
            res.status(400).send('Missing game_id or entity_id');
            return;
        }
        if (this.checkCache(game_id, "options", res)) {
            return
        }
        this.processingDynamic.get("options")?.add(game_id);
        this.gameInfoService.getActionOptions(game_id, entity_id)
            .then((actionOptions: any) => {
                this.dynamicCache.get("options")?.set(game_id, actionOptions);
                res.json(actionOptions);
            })
            .catch((error: any) => {
                res.status(500).send(error);
            })
            .finally(() => {
                this.processingDynamic.delete(game_id);
            });
    }

    public getMemoryCell(req: Request, res: Response): void {
        const { game_id, memory_cell } = req.params;
        if (!game_id || !memory_cell) {
            res.status(400).send('Missing game_id or memory_cell');
            return;
        }
        if (this.checkCache(game_id, "message", res)) {
            return
        }
        this.processingStatic.get("message")?.add(game_id);
        this.gameInfoService.getMemoryCell(game_id, memory_cell)
            .then((memoryCell: any) => {
                this.staticCache.get("message")?.set(game_id, memoryCell);
                res.json(memoryCell);
            })
            .catch((error: any) => {
                res.status(500).send(error);
            })
            .finally(() => {
                this.processingStatic.delete(game_id);
            });
    }
}