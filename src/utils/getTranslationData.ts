import {Translation} from "../models/Translation";

export const getTranslationData = (): Translation => {
    const result = {
        "ua_UK": {
            "builtins": {
                "back": "Назад",
                "next": "Далі",
                "cancel": "Скасувати",
                "close": "Закрити"
            }
        },
        "en_US": {
            "builtins": {
                "back": "Back",
                "next": "Next",
                "cancel": "Cancel",
                "close": "Close"
            }
        }
    }
    return result
}