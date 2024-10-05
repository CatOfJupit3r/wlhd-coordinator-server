const REGEX_FACTORY = (pattern: string, flags?: string) => {
    return (): RegExp => new RegExp(pattern, flags)
}

export const DLC_TAG_REGEX = REGEX_FACTORY('^[a-z]+$', 'gm')
export const DESCRIPTOR_REGEX = REGEX_FACTORY('^[a-z]+:[a-z._-]+$', 'gm')
export const DESCRIPTOR_NO_DLC_REGEX = REGEX_FACTORY('^[a-z._-]+$', 'gm')
export const GITHUB_LINK_REGEX = REGEX_FACTORY(
    'https?:\\/\\/github\\.com\\/(?:[^\\/\\s]+\\/)+(?:wlhd-[A-Za-z]+-package|)',
    'gm'
)
