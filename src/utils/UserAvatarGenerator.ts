import { Canvas, createCanvas } from 'canvas'
import * as crypto from 'crypto'

class UserAvatarGenerator {
    private hexToRgb(hexColor: string): [number, number, number] {
        hexColor = hexColor.replace('#', '')
        return [
            parseInt(hexColor.slice(0, 2), 16),
            parseInt(hexColor.slice(2, 4), 16),
            parseInt(hexColor.slice(4, 6), 16),
        ]
    }

    private mixColors(color1: [number, number, number], color2: [number, number, number]): [number, number, number] {
        const [r1, g1, b1] = color1
        const [r2, g2, b2] = color2
        return [Math.floor((r1 + r2) / 2), Math.floor((g1 + g2) / 2), Math.floor((b1 + b2) / 2)]
    }

    private hashToSeed(hashString: string): number {
        // Use the crypto library to create a reproducible hash-based seed
        const hash = crypto.createHash('sha256').update(hashString).digest('hex')
        return parseInt(hash.slice(0, 8), 16) // Convert part of hash to an integer
    }

    private createSeededRandom(seed: number) {
        return function (): number {
            const x = Math.sin(seed++) * 10000
            return x - Math.floor(x)
        }
    }

    public generateImage(
        colorOfPixels: string,
        colorOfBackground: string,
        hashString: string,
        scaleFactor = 50
    ): Canvas {
        const width = 8
        const height = 8
        const scaledWidth = width * scaleFactor
        const scaledHeight = height * scaleFactor
        const canvas = createCanvas(scaledWidth, scaledHeight)
        const ctx = canvas.getContext('2d')

        const secondaryColor = this.hexToRgb(colorOfBackground)
        const primaryColor = this.hexToRgb(colorOfPixels)
        const middleColor = this.mixColors(secondaryColor, primaryColor)
        const palette = [primaryColor, middleColor, secondaryColor]

        const seed = this.hashToSeed(hashString)
        const random = this.createSeededRandom(seed)

        const darkener = [65, 74, 76]
        const darkerPalette = [
            this.mixColors(secondaryColor, darkener as [number, number, number]),
            this.mixColors(primaryColor, darkener as [number, number, number]),
        ]

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                // Use random choice instead of modulus to align with Python's color selection
                const color =
                    x === 1 || x === 2
                        ? darkerPalette[Math.floor(random() * darkerPalette.length)]
                        : palette[Math.floor(random() * palette.length)]

                if (!color) {
                    console.error('Error in color selection logic')
                    continue
                }

                ctx.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`
                ctx.fillRect(x * scaleFactor, y * scaleFactor, scaleFactor, scaleFactor)
            }
        }

        return canvas
    }
}

export default new UserAvatarGenerator()
