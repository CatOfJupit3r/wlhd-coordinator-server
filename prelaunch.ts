import {GAME_SERVER_URL} from "./src/configs/config";
import {DLCManifest} from "./src/models/DLCManifest";
import * as git from 'isomorphic-git';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'isomorphic-git/http/node';
import {
    // DLC_UPDATES_ENABLED,
} from './src/configs/config';


const downloadDlc = async (installed_packages: string[] = []): Promise<void> => {
    try {
        const response = await fetch(`${GAME_SERVER_URL}/dlcs`);
        const list_of_dlc: DLCManifest[] = await response.json() as DLCManifest[];
        for (const dlc of list_of_dlc) {
            if (!('descriptor' in dlc) || !('source' in dlc)) {
                continue;
            }
            const dlc_source: string = dlc.source.trim();
            const dlc_descriptor: string = dlc.descriptor.trim();
            if (dlc_source === 'local') {
                continue;
            } else if (dlc_source.startsWith('https://github.com/')) {
                try {
                    const dlc_folder_name: string = (dlc_source.split('/').pop() as string).split('.')[0];
                    const dlc_folder_path: string = path.join(__dirname, 'data', dlc_folder_name);
                    if (installed_packages.includes(dlc_descriptor)) {
                        if (!DLC_UPDATES_ENABLED) {
                            continue;
                        }
                        await git.pull({
                            fs,
                            http: https,
                            dir: dlc_folder_path,
                            ref: 'main',
                            singleBranch: true,
                            fastForwardOnly: true,
                        });
                    } else {
                        if (fs.existsSync(dlc_folder_path)) {
                            fs.rmdirSync(dlc_folder_path, { recursive: true });
                        }
                        fs.mkdirSync(dlc_folder_path, { recursive: true });
                        await git.clone({
                            fs,
                            http: https,
                            dir: dlc_folder_path,
                            url: dlc_source,
                            ref: 'main',
                            singleBranch: true,
                            depth: 1,
                        });
                    }
                } catch (error) {
                    console.error(`Something went wrong when working with repo from ${dlc_source}`);
                    console.error(error);
                }
            }
        }
    } catch (error) {
        console.error(`Error while reaching API server: ${error}`);
        return;
    }
};


// I am struggling with authentication, so for now I leave it as is

// downloadDlc();