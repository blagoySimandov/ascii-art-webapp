package main

import (
	"image"
	"image/color"
	"image/png"
	"os"
)

func main() {
	width := 200
	height := 200
	img := image.NewRGBA(image.Rect(0, 0, width, height))

	// Draw a simple pattern
	for y := 0; y < height; y++ {
		for x := 0; x < width; x++ {
			c := color.RGBA{uint8(x ^ y), uint8(x & y), uint8(x | y), 255}
			img.Set(x, y, c)
		}
	}

	f, _ := os.Create("test_image.png")
	defer f.Close()
	png.Encode(f, img)
}
