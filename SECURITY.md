# Security Policy

## Security Model

The Doublecheck program implements a multi-layered security model to ensure the integrity of document verification on the Solana blockchain.

## Threat Model

### Protected Against

1. **Account Substitution Attacks**
   - All accounts use PDAs with validated seeds
   - Anchor's constraint system prevents wrong account injection

2. **Unauthorized Document Issuance**
   - Only registered and authorized issuers can issue documents
   - Issuer authorization checked on every document operation

3. **Document Tampering**
   - Documents are identified by cryptographic hashes
   - Only original issuer can modify document status
   - All modifications are timestamped

4. **Admin Impersonation**
   - Admin wallet is validated against stored AdminState
   - Only the original admin can register new issuers

5. **Replay Attacks**
   - PDAs prevent duplicate account creation
   - Each document hash can only be registered once

6. **Integer Overflow**
   - All arithmetic operations use checked methods
   - Counters are u64 preventing realistic overflow

### Security Assumptions

1. **Admin Key Security**
   - The admin wallet private key must be kept secure
   - Compromise of admin key allows unauthorized issuer registration
   - Recommendation: Use multisig or hardware wallet for admin

2. **Issuer Key Security**
   - Issuer private keys must be kept secure
   - Compromised issuer can issue fraudulent documents
   - Recommendation: Use institutional key management

3. **Document Hash Security**
   - SHA3-256 or SHA-256 assumed to be cryptographically secure
   - Hash collisions are computationally infeasible
   - Salt usage recommended for sensitive documents

4. **Solana Runtime Security**
   - Program execution relies on Solana runtime security
   - Validator consensus ensures state integrity

## Security Features

### 1. PDA-Based Authorization

All accounts use Program Derived Addresses (PDAs):

```rust
// Admin PDA - Singleton
seeds = [b"admin"]

// Issuer PDA - One per issuer
seeds = [b"issuer", issuer_pubkey.as_ref()]

// Document PDA - One per document hash
seeds = [b"document_hash", document_hash.as_ref()]
```

This prevents:
- Account substitution
- Address collision
- Unauthorized account creation

### 2. Constraint-Based Validation

Every instruction validates:
- Signer authorization
- Account ownership
- State consistency

```rust
constraint = admin_state.admin_wallet == admin.key() @ DoublecheckError::UnauthorizedAdmin
constraint = issuer_state.is_authorized @ DoublecheckError::IssuerNotAuthorized
constraint = document_hash_account.issuer_pubkey == issuer.key() @ DoublecheckError::UnauthorizedIssuer
```

### 3. Immutable Document Hashes

Once issued, the document hash itself cannot be changed:
- Hash is stored in account state
- Hash is part of PDA seeds
- Only status can be updated (by original issuer)

### 4. Audit Trail

All operations include timestamps:
- `created_at` - When account was created
- `updated_at` - Last modification time
- Enables chronological verification

### 5. Error Handling

No panics - all errors return structured error codes:
- Prevents unexpected program termination
- Enables proper error handling in clients
- Facilitates debugging and monitoring

## Known Limitations

### 1. Admin Centralization

**Issue**: Single admin wallet controls issuer registration

**Mitigation**:
- Use multisig wallet for admin
- Implement governance mechanism in future version
- Monitor admin operations

**Risk Level**: Medium (depends on admin key security)

### 2. Issuer Trust

**Issue**: Issuers can issue arbitrary document hashes

**Mitigation**:
- Careful issuer vetting during registration
- Regular issuer audits
- Ability to track all documents per issuer

**Risk Level**: Medium (depends on issuer trustworthiness)

### 3. No Document Content Verification

**Issue**: Program only stores hashes, not document content

**Mitigation**:
- This is by design for privacy
- Off-chain systems must verify document content
- Hash comparison confirms document authenticity

**Risk Level**: Low (acceptable design choice)

### 4. No Issuer Deauthorization

**Issue**: No instruction to revoke issuer authorization

**Mitigation**:
- Future version can add deauthorization instruction
- Compromised issuers can be identified by monitoring
- New admin can be established if needed

**Risk Level**: Low (can be addressed in upgrade)

### 5. Permanent Document Records

**Issue**: Document hashes cannot be deleted, only revoked

**Mitigation**:
- This is intentional for audit trail
- Revoked status clearly indicates invalidity
- Account closure could be added in future version

**Risk Level**: Very Low (acceptable design choice)

## Security Best Practices

### For Admin

1. **Key Management**
   - Use hardware wallet or multisig
   - Never expose private key
   - Regular key rotation if possible

2. **Issuer Vetting**
   - Verify issuer identity thoroughly
   - Establish clear registration criteria
   - Document issuer approval process

3. **Monitoring**
   - Track all issuer registrations
   - Monitor for suspicious activity
   - Maintain issuer registry off-chain

### For Issuers

1. **Key Management**
   - Use institutional key management
   - Implement access controls
   - Regular security audits

2. **Document Hashing**
   - Use SHA3-256 or SHA-256
   - Consider salting for sensitive documents
   - Verify hash before issuance

3. **Operational Security**
   - Limit access to issuer keys
   - Log all document issuances
   - Regular security training

### For Users/Verifiers

1. **Hash Verification**
   - Always recompute document hash
   - Compare with on-chain hash
   - Check document status (not revoked)

2. **Issuer Verification**
   - Verify issuer identity off-chain
   - Check issuer reputation
   - Confirm issuer authorization

3. **Timestamp Validation**
   - Check document issuance date
   - Verify it matches expected timeframe
   - Consider update timestamps

## Incident Response

### If Admin Key is Compromised

1. **Immediate Actions**
   - Identify unauthorized issuer registrations
   - Notify all legitimate issuers
   - Prepare program upgrade with new admin

2. **Recovery**
   - Deploy new program version
   - Migrate legitimate issuers
   - Invalidate old program

3. **Post-Incident**
   - Audit all operations
   - Implement additional security measures
   - Document lessons learned

### If Issuer Key is Compromised

1. **Immediate Actions**
   - Identify fraudulent documents issued
   - Revoke compromised issuer's documents if possible
   - Notify users and verifiers

2. **Recovery**
   - Register new issuer with new keys
   - Migrate valid documents if needed
   - Update off-chain records

3. **Post-Incident**
   - Investigate compromise source
   - Improve key management
   - Enhanced monitoring

## Security Audit Recommendations

Before mainnet deployment, conduct:

1. **Code Audit**
   - Review all instruction handlers
   - Verify constraint logic
   - Check for integer overflow/underflow
   - Validate PDA derivation

2. **Penetration Testing**
   - Attempt unauthorized operations
   - Test all error conditions
   - Verify access controls
   - Simulate attack scenarios

3. **Formal Verification**
   - Verify PDA uniqueness
   - Prove authorization invariants
   - Validate state transitions

## Reporting Security Issues

If you discover a security vulnerability:

1. **Do NOT** open a public issue
2. Contact the development team privately
3. Provide detailed description and reproduction steps
4. Allow reasonable time for fix before disclosure

## Security Updates

This program follows responsible disclosure:

- Critical: Patch within 24 hours
- High: Patch within 7 days
- Medium: Patch within 30 days
- Low: Patch in next release

## Compliance Considerations

### Data Privacy

- Only hashes stored on-chain (no personal data)
- GDPR compliant (no PII)
- Right to be forgotten: N/A (only hashes)

### Audit Trail

- All operations timestamped
- Immutable record of documents
- Supports compliance auditing

### Access Control

- Role-based access (Admin, Issuer)
- Cryptographic authentication
- Non-repudiation through signatures

## Security Checklist for Deployment

- [ ] Admin wallet secured (multisig/hardware)
- [ ] All issuers vetted and approved
- [ ] Test suite passes all security tests
- [ ] Code audit completed
- [ ] Penetration testing performed
- [ ] Monitoring and alerting configured
- [ ] Incident response plan documented
- [ ] Key management procedures established
- [ ] User documentation includes security best practices
- [ ] Emergency contacts and procedures defined

## Additional Resources

- [Solana Security Best Practices](https://docs.solana.com/developing/programming-model/security)
- [Anchor Security Guidelines](https://www.anchor-lang.com/docs/security)
- [Neodyme Security Workshop](https://workshop.neodyme.io/)
- [Sealevel Attacks](https://github.com/coral-xyz/sealevel-attacks)
