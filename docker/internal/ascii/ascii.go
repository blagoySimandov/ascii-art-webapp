package ascii

import (
	"fmt"
	"image"
	_ "image/jpeg"
	"io"
	"strings"

	"github.com/nfnt/resize"
)

var Chars = strings.Split("`^\",:;Il!i~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$", "")

func Convert(file io.Reader, size uint) ([][]string, error) {
	pixels, err := getPixels(file, size)
	if err != nil {
		return nil, err
	}

	scale := 256 / len(Chars)
	var picture [][]string

	for _, row := range pixels {
		var arr []string
		for _, y := range row {
			idx := y / scale
			if idx > len(Chars)-1 {
				idx = len(Chars) - 1
			}
			arr = append(arr, Chars[idx])
		}
		picture = append(picture, arr)
	}

	return picture, nil
}

func getPixels(file io.Reader, size uint) ([][]int, error) {
	imageDecoded, _, err := image.Decode(file)
	if err != nil {
		return nil, fmt.Errorf("image could not be decoded: %w", err)
	}

	origBounds := imageDecoded.Bounds()
	origW := float64(origBounds.Dx())
	origH := float64(origBounds.Dy())

	// Characters in monospace fonts are typically about twice as tall as they are wide.
	// We multiply the height by 0.45 to squash the image so that when it is
	// rendered as text, it stretches back out to the correct proportions.
	ratio := origH / origW
	adjustedHeight := uint(float64(size) * ratio * 0.45)

	img := resize.Resize(size, adjustedHeight, imageDecoded, resize.Lanczos2)
	bounds := img.Bounds()
	w, h := bounds.Max.X, bounds.Max.Y

	var pixels [][]int
	for y := 0; y < h; y++ {
		var row []int
		for x := 0; x < w; x++ {
			row = append(row, rgbaToGrayscale(img.At(x, y).RGBA()))
		}
		pixels = append(pixels, row)
	}

	return pixels, nil
}

func rgbaToGrayscale(r, g, b, _ uint32) int {
	// this is just the average but it's weighted.
	// human eyes are more sensitive to green than red or blue.
	// it's called the Luminosity method
	// for more info: https://www.johndcook.com/blog/2009/08/24/algorithms-convert-color-grayscale/
	return int(0.299*float64(r>>8) + 0.587*float64(g>>8) + 0.114*float64(b>>8))
}
