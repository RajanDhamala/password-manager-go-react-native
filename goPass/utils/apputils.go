package utils

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"log"
	"time"

	"github.com/google/uuid"
)

var (
	AccessSecret  = []byte("ACCESS_SECRET_KEY_123")
	RefreshSecret = []byte("REFRESH_SECRET_KEY_456")
)

type ActualPayload struct {
	Id   uuid.UUID `json:"id"`
	Type string    `json:"type"`
	Iat  int64     `json:"iat"`
	Exp  int64     `json:"exp"`
}

func SignPayload(secret []byte, payload any) (string, error) {
	dataBytes, err := json.Marshal(payload)
	if err != nil {
		return "", err
	}

	payloadB64 := base64.RawURLEncoding.EncodeToString(dataBytes)

	h := hmac.New(sha256.New, secret)
	h.Write([]byte(payloadB64))
	signature := h.Sum(nil)

	signatureB64 := base64.RawURLEncoding.EncodeToString(signature)

	return payloadB64 + "." + signatureB64, nil
}

func CreateAppAccessToken(id uuid.UUID) (string, error) {
	now := time.Now().Unix()

	payload := ActualPayload{
		Id:   id,
		Type: "access",
		Iat:  now,
		Exp:  now + 15*60, // 15 min
	}

	return SignPayload(AccessSecret, payload)
}

func CreateAppRefreshToken(id uuid.UUID) (string, error) {
	now := time.Now().Unix()

	payload := ActualPayload{
		Id:   id,
		Type: "refresh",
		Iat:  now,
		Exp:  now + 7*24*60*60, // 7 days
	}

	return SignPayload(RefreshSecret, payload)
}

func VerifyAccessToken(token string) (*ActualPayload, error) {
	log.Println("we go the req;")
	return verifyToken(token, AccessSecret, "access")
}

func VerifyRefreshToken(token string) (*ActualPayload, error) {
	return verifyToken(token, RefreshSecret, "refresh")
}

func verifyToken(token string, secret []byte, expectedType string) (*ActualPayload, error) {
	parts := splitToken(token)
	if len(parts) != 2 {
		return nil, errors.New("invalid token format")
	}
	payloadB64 := parts[0]
	signatureB64 := parts[1]

	signature, err := base64.RawURLEncoding.DecodeString(signatureB64)
	if err != nil {
		return nil, errors.New("invalid signature encoding")
	}

	h := hmac.New(sha256.New, secret)
	h.Write([]byte(payloadB64))
	expectedSig := h.Sum(nil)

	if !hmac.Equal(signature, expectedSig) {
		return nil, errors.New("invalid token signature")
	}

	payloadBytes, err := base64.RawURLEncoding.DecodeString(payloadB64)
	if err != nil {
		return nil, errors.New("invalid payload encoding")
	}

	var payload ActualPayload
	if err := json.Unmarshal(payloadBytes, &payload); err != nil {
		return nil, errors.New("invalid payload JSON")
	}

	if payload.Type != expectedType {
		return nil, errors.New("token type mismatch")
	}

	if time.Now().Unix() > payload.Exp {
		return nil, errors.New("token expired")
	}

	return &payload, nil
}

func splitToken(token string) []string {
	for i := 0; i < len(token); i++ {
		if token[i] == '.' {
			return []string{token[:i], token[i+1:]}
		}
	}
	return []string{}
}
