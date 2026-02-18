package repositories

import "testing"

func TestBindSQLiteLeavesQuestionMarks(t *testing.T) {
	prev := usePostgres
	usePostgres = false
	t.Cleanup(func() { usePostgres = prev })

	q := "SELECT * FROM cars WHERE brand=? AND model=? LIMIT ? OFFSET ?"
	got := bind(q)
	if got != q {
		t.Fatalf("expected sqlite query to remain unchanged, got: %s", got)
	}
}

func TestBindPostgresReplacesQuestionMarks(t *testing.T) {
	prev := usePostgres
	usePostgres = true
	t.Cleanup(func() { usePostgres = prev })

	q := "SELECT * FROM cars WHERE brand=? AND model=? LIMIT ? OFFSET ?"
	got := bind(q)
	want := "SELECT * FROM cars WHERE brand=$1 AND model=$2 LIMIT $3 OFFSET $4"
	if got != want {
		t.Fatalf("unexpected postgres bind query:\nwant: %s\ngot:  %s", want, got)
	}
}

