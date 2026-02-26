package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"

	"github.com/blagoySimandov/wds-assignment2/internal/ascii"
)

func main() {
	mux := http.NewServeMux()

	mux.Handle("/", http.FileServer(http.Dir("static")))

	mux.HandleFunc("/api/convert", handleConvert)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	fmt.Printf("Server listening on :%s\n", port)
	if err := http.ListenAndServe(":"+port, mux); err != nil {
		fmt.Fprintf(os.Stderr, "Error starting server: %v\n", err)
		os.Exit(1)
	}
}

func handleConvert(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, 10<<20)

	file, _, err := r.FormFile("image")
	if err != nil {
		http.Error(w, "Could not read uploaded file", http.StatusBadRequest)
		return
	}

	picture, err := ascii.Convert(file, 280)
	if err != nil {
		http.Error(w, "Could not convert image: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	err = json.NewEncoder(w).Encode(map[string]any{
		"ascii": picture,
	})
	if err != nil {
		http.Error(w, "Could not encode response: "+err.Error(), http.StatusInternalServerError)
		return
	}
	err = file.Close()
	if err != nil {
		http.Error(w, "Could not close file: "+err.Error(), http.StatusInternalServerError)
		return
	}
}
