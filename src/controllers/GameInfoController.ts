import { Request, Response } from 'express';
import { GameInfoService } from '../services/GameInfoService';
import { Cache } from '../utils/Cache';

export class GameInfoController {

    private gameInfoService: GameInfoService;
    private staticCommands: string[] = ["message"];
    private dynamicCommands: string[] = ["field", "options", "all_memory_cells", "entity", "entities_info"];

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

    private checkCache(game_id: string, command: string, res: Response): boolean {
        const maxAttempts = 5;
        let attempts = 0;

        if (this.dynamicCommands.includes(command)) {
            if (this.dynamicCache.get(command)?.get(game_id)) {
                res.json(this.dynamicCache.get(command)?.get(game_id));
                return true;
            } else if (this.processingDynamic.get(command)?.has(game_id)) {
                while (!this.dynamicCache.get(command)?.get(game_id) && attempts < maxAttempts) {
                    setTimeout(() => {}, 2000);
                    attempts++;
                }
                if (attempts === maxAttempts) {
                    res.status(500).send('Cache could not be filled');
                    return true;
                }
                res.json(this.dynamicCache.get(command)?.get(game_id));
                return true;
            }
        } else {
            if (this.staticCache.get(command)?.get(game_id)) {
                res.json(this.staticCache.get(command)?.get(game_id));
                return true;
            } else if (this.processingStatic.get(command)?.has(game_id)) {
                while (!this.staticCache.get(command)?.get(game_id) && attempts < maxAttempts) {
                    setTimeout(() => {}, 2000);
                    attempts++;
                }
                if (attempts === maxAttempts) {
                    res.status(500).send('Cache could not be filled');
                }
                res.json(this.staticCache.get(command)?.get(game_id));
                return true;
            }
            return false;
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

    public getAllMemoryCells(req: Request, res: Response): void {
        const { game_id } = req.params;
        if (!game_id) {
            res.status(400).send('Missing game_id');
            return;
        }
        if (this.checkCache(game_id, "all_memory_cells", res)) {
            return
        }
        this.processingDynamic.get("all_memory_cells")?.add(game_id);
        this.gameInfoService.getAllMemoryCells(game_id)
            .then((memoryCells: any) => {
                this.dynamicCache.get("all_memory_cells")?.set(game_id, memoryCells);
                res.json(memoryCells);
            })
            .catch((error: any) => {
                res.status(500).send(error);
            })
            .finally(() => {
                this.processingDynamic.delete(game_id);
            });
    }

    public getEntityInfo(req: Request, res: Response): void {
        const { game_id, entity_id } = req.params;
        if (!game_id || !entity_id) {
            res.status(400).send('Missing game_id or entity_id');
            return;
        }
        if (this.checkCache(game_id, "entity", res)) {
            return
        }
        this.processingDynamic.get("entity")?.add(game_id);
        this.gameInfoService.getEntityInfo(game_id, entity_id)
            .then((entityInfo: any) => {
                this.dynamicCache.get("entity")?.set(game_id, entityInfo);
                res.json(entityInfo);
            })
            .catch((error: any) => {
                res.status(500).send(error);
            })
            .finally(() => {
                this.processingDynamic.delete(game_id);
            });
    }

public getAllEntityInfo(req: Request, res: Response): void {
        const { game_id } = req.params;
        if (!game_id) {
            res.status(400).send('Missing game_id');
            return;
        }
        if (this.checkCache(game_id, "entities_info", res)) {
            return
        }
        this.processingDynamic.get("entities_info")?.add(game_id);
        this.gameInfoService.getAllEntityInfo(game_id)
            .then((entitiesInfo: any) => {
                this.dynamicCache.get("entities_info")?.set(game_id, entitiesInfo);
                res.json(entitiesInfo);
            })
            .catch((error: any) => {
                res.status(500).send(error);
            })
            .finally(() => {
                this.processingDynamic.delete(game_id);
            });
    }

}