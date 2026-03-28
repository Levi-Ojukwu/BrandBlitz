#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype,
    token::Client as TokenClient,
    Address, Env, String,
};

/// Storage keys
#[contracttype]
pub enum DataKey {
    Admin,
    Token,    // USDC contract address
    Balance,
    Memo,
    Depositor,
    Settled,
}

/// Events emitted by the contract
mod events {
    pub const DEPOSITED: &str = "deposited";
    pub const SETTLED: &str = "settled";
    pub const REFUNDED: &str = "refunded";
}

#[contract]
pub struct EscrowContract;

#[contractimpl]
impl EscrowContract {
    /// Initialize the escrow.
    /// - `admin`    : the BrandBlitz hot-wallet address authorised to settle/refund
    /// - `token`    : the USDC SAC contract address on this network
    /// - `memo`     : unique challenge memo so Horizon events can be correlated
    pub fn initialize(env: Env, admin: Address, token: Address, memo: String) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Token, &token);
        env.storage().instance().set(&DataKey::Memo, &memo);
        env.storage().instance().set(&DataKey::Settled, &false);
        env.storage().instance().set(&DataKey::Balance, &0_i128);
    }

    /// Brand calls this to deposit USDC into escrow.
    /// The brand must have already approved `amount` for this contract.
    pub fn deposit(env: Env, depositor: Address, amount: i128) {
        depositor.require_auth();

        if amount <= 0 {
            panic!("amount must be positive");
        }
        if env.storage().instance().get::<DataKey, bool>(&DataKey::Settled).unwrap_or(false) {
            panic!("already settled");
        }

        let token: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        TokenClient::new(&env, &token).transfer(&depositor, &env.current_contract_address(), &amount);

        let current: i128 = env.storage().instance().get(&DataKey::Balance).unwrap_or(0);
        env.storage().instance().set(&DataKey::Balance, &(current + amount));
        env.storage().instance().set(&DataKey::Depositor, &depositor);

        env.events().publish((events::DEPOSITED,), (depositor, amount));
    }

    /// Admin settles the escrow by distributing USDC to winners.
    /// `recipients` is a list of (address, amount) pairs.
    /// Sum of amounts must be <= balance (remainder stays in contract for gas reserve).
    pub fn settle(
        env: Env,
        recipients: soroban_sdk::Vec<(Address, i128)>,
    ) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        if env.storage().instance().get::<DataKey, bool>(&DataKey::Settled).unwrap_or(false) {
            panic!("already settled");
        }

        let token: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let client = TokenClient::new(&env, &token);
        let balance: i128 = env.storage().instance().get(&DataKey::Balance).unwrap_or(0);

        let mut total_distributed: i128 = 0;
        for (recipient, amount) in recipients.iter() {
            if amount <= 0 {
                panic!("recipient amount must be positive");
            }
            total_distributed += amount;
            if total_distributed > balance {
                panic!("insufficient balance");
            }
            client.transfer(&env.current_contract_address(), &recipient, &amount);
        }

        env.storage().instance().set(&DataKey::Settled, &true);
        env.storage().instance().set(&DataKey::Balance, &(balance - total_distributed));

        env.events().publish((events::SETTLED,), total_distributed);
    }

    /// Admin refunds the full balance back to the depositor (e.g. cancelled challenge).
    pub fn refund(env: Env) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        if env.storage().instance().get::<DataKey, bool>(&DataKey::Settled).unwrap_or(false) {
            panic!("already settled");
        }

        let balance: i128 = env.storage().instance().get(&DataKey::Balance).unwrap_or(0);
        if balance == 0 {
            panic!("nothing to refund");
        }

        let token: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let depositor: Address = env.storage().instance().get(&DataKey::Depositor).unwrap();

        TokenClient::new(&env, &token).transfer(
            &env.current_contract_address(),
            &depositor,
            &balance,
        );

        env.storage().instance().set(&DataKey::Settled, &true);
        env.storage().instance().set(&DataKey::Balance, &0_i128);

        env.events().publish((events::REFUNDED,), (depositor, balance));
    }

    /// View: returns the current escrowed USDC balance.
    pub fn balance(env: Env) -> i128 {
        env.storage().instance().get(&DataKey::Balance).unwrap_or(0)
    }

    /// View: returns whether the escrow has been settled or refunded.
    pub fn is_settled(env: Env) -> bool {
        env.storage().instance().get(&DataKey::Settled).unwrap_or(false)
    }

    /// View: returns the memo string set at initialization.
    pub fn memo(env: Env) -> String {
        env.storage().instance().get(&DataKey::Memo).unwrap()
    }
}

mod test;
