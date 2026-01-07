.PHONY: help build test clean deploy-devnet deploy-local format lint check

help:
	@echo "Doublecheck - Solana Document Verification System"
	@echo ""
	@echo "Available commands:"
	@echo "  make build          - Build the Anchor program"
	@echo "  make test           - Run tests with local validator"
	@echo "  make clean          - Clean build artifacts"
	@echo "  make deploy-local   - Deploy to local validator"
	@echo "  make deploy-devnet  - Deploy to Solana devnet"
	@echo "  make format         - Format code"
	@echo "  make lint           - Run linter"
	@echo "  make check          - Check code without building"

build:
	@echo "Building Anchor program..."
	anchor build

test:
	@echo "Running tests..."
	anchor test

clean:
	@echo "Cleaning build artifacts..."
	rm -rf target/
	rm -rf .anchor/
	rm -rf test-ledger/
	cargo clean

deploy-local:
	@echo "Deploying to local validator..."
	anchor deploy

deploy-devnet:
	@echo "Deploying to Solana devnet..."
	anchor deploy --provider.cluster devnet

format:
	@echo "Formatting code..."
	cargo fmt --all

lint:
	@echo "Running linter..."
	cargo clippy --all-targets -- -D warnings

check:
	@echo "Checking code..."
	cargo check --all-targets

install-deps:
	@echo "Installing dependencies..."
	yarn install || npm install

setup-local:
	@echo "Setting up local development environment..."
	solana config set --url localhost
	solana-keygen new --no-bip39-passphrase || true

setup-devnet:
	@echo "Setting up devnet environment..."
	solana config set --url devnet
	solana airdrop 2 || echo "Airdrop may have failed, try again later"

verify:
	@echo "Verifying program..."
	anchor build --verifiable
