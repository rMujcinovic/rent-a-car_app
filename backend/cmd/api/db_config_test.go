package main

import (
	"os"
	"testing"
)

func TestUsingPostgres(t *testing.T) {
	orig := os.Getenv("DATABASE_URL")
	t.Cleanup(func() {
		_ = os.Setenv("DATABASE_URL", orig)
	})

	_ = os.Setenv("DATABASE_URL", "postgresql://user:pass@localhost:5432/db?sslmode=disable")
	if !usingPostgres() {
		t.Fatalf("expected usingPostgres to return true for postgresql:// URL")
	}

	_ = os.Setenv("DATABASE_URL", "postgres://user:pass@localhost:5432/db?sslmode=disable")
	if !usingPostgres() {
		t.Fatalf("expected usingPostgres to return true for postgres:// URL")
	}

	_ = os.Setenv("DATABASE_URL", "./rentacar.db")
	if usingPostgres() {
		t.Fatalf("expected usingPostgres to return false for sqlite path")
	}
}

func TestBind(t *testing.T) {
	orig := os.Getenv("DATABASE_URL")
	t.Cleanup(func() {
		_ = os.Setenv("DATABASE_URL", orig)
	})

	_ = os.Setenv("DATABASE_URL", "postgres://user:pass@localhost:5432/db?sslmode=disable")
	got := bind("SELECT * FROM users WHERE username=? AND role=?")
	want := "SELECT * FROM users WHERE username=$1 AND role=$2"
	if got != want {
		t.Fatalf("unexpected postgres bind result:\nwant: %s\ngot:  %s", want, got)
	}

	_ = os.Setenv("DATABASE_URL", "./rentacar.db")
	got = bind("SELECT * FROM users WHERE username=? AND role=?")
	want = "SELECT * FROM users WHERE username=? AND role=?"
	if got != want {
		t.Fatalf("unexpected sqlite bind result:\nwant: %s\ngot:  %s", want, got)
	}
}

