use anchor_lang::prelude::*;

#[error_code]
pub enum DoublecheckError {
    #[msg("Issuer is already registered")]
    IssuerAlreadyRegistered,
    
    #[msg("Issuer is not authorized")]
    IssuerNotAuthorized,
    
    #[msg("Document hash already exists")]
    DocumentAlreadyExists,
    
    #[msg("Document not found")]
    DocumentNotFound,
    
    #[msg("Unauthorized issuer - only the original issuer can modify this document")]
    UnauthorizedIssuer,
    
    #[msg("Unauthorized admin - only the admin can perform this action")]
    UnauthorizedAdmin,
    
    #[msg("Admin is already initialized")]
    AdminAlreadyInitialized,
    
    #[msg("Invalid hash format or length")]
    InvalidHash,
    
    #[msg("Issuer name exceeds maximum length")]
    IssuerNameTooLong,
}
