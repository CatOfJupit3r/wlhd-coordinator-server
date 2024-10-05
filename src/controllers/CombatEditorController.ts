import { createRouteInController } from '@controllers/RouteInController'
import CombatEditorService from '@services/GameServerService'
import PackageManagerService from '@services/PackageManagerService'
import { Request, Response } from 'express'
import { z } from 'zod'

const CombatEditorQuery = z.object({
    dlc: z.string().refine((dlc) => PackageManagerService.isDLCInstalled(dlc), {
        message: `Provided DLC is not installed on coordinator server. Check if you typed it correctly!`,
    }),
})

class CombatEditorController {
    getLoadedItems = createRouteInController(
        async (req: Request, res: Response) => {
            const { dlc } = req.query
            const items = CombatEditorService.getLoadedItems(dlc as string)
            res.status(200).json({ result: 'ok', items })
        },
        { query: CombatEditorQuery }
    )

    getLoadedWeapons = createRouteInController(
        async (req: Request, res: Response) => {
            const { dlc } = req.query
            const weapons = CombatEditorService.getLoadedWeapons(dlc as string)
            res.status(200).json({ result: 'ok', weapons })
        },
        { query: CombatEditorQuery }
    )

    getLoadedSpells = createRouteInController(
        async (req: Request, res: Response) => {
            const { dlc } = req.query
            const spells = CombatEditorService.getLoadedSpells(dlc as string)
            res.status(200).json({ result: 'ok', spells })
        },
        { query: CombatEditorQuery }
    )

    getLoadedStatusEffects = createRouteInController(
        async (req: Request, res: Response) => {
            const { dlc } = req.query
            const status_effects = CombatEditorService.getLoadedStatusEffects(dlc as string)
            res.status(200).json({ result: 'ok', status_effects })
        },
        { query: CombatEditorQuery }
    )

    getLoadedCharacters = createRouteInController(
        async (req: Request, res: Response) => {
            const { dlc } = req.query
            const characters = CombatEditorService.getLoadedCharacters(dlc as string)
            res.status(200).json({ result: 'ok', characters })
        },
        { query: CombatEditorQuery }
    )

    createCombatPreset = createRouteInController(async (req: Request, res: Response) => {
        // stub for saving presets in db. not used anywhere.
        // if you are searching for creating lobby combat, then look at LobbyController.ts
        res.status(200).json({ result: 'ok', preset_id: '111' })
    })
}

export default new CombatEditorController()
