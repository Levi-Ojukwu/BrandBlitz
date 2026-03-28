#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::{Address as _, AuthorizedFunction, AuthorizedInvocation},
    token, vec, Address, Env, IntoVal, String,
};

fn create_token<'a>(
    env: &Env,
    admin: &Address,
) -> (token::Client<'a>, token::StellarAssetClient<'a>) {
    let sac = env.register_stellar_asset_contract_v2(admin.clone());
    (
        token::Client::new(env, &sac.address()),
        token::StellarAssetClient::new(env, &sac.address()),
    )
}

#[test]
fn test_deposit_and_settle() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let brand = Address::generate(&env);
    let winner1 = Address::generate(&env);
    let winner2 = Address::generate(&env);

    let (usdc, usdc_admin) = create_token(&env, &admin);

    // Mint 1000 USDC to brand
    usdc_admin.mint(&brand, &1_000_0000000_i128);

    let contract_id = env.register(EscrowContract, ());
    let client = EscrowContractClient::new(&env, &contract_id);

    let memo = String::from_str(&env, "BLITZ-ABC123");

    // Initialize
    client.initialize(&admin, &usdc.address, &memo);

    // Deposit 100 USDC
    client.deposit(&brand, &100_0000000_i128);
    assert_eq!(client.balance(), 100_0000000_i128);
    assert!(!client.is_settled());

    // Settle: winner1 gets 60, winner2 gets 40
    let recipients = vec![
        &env,
        (winner1.clone(), 60_0000000_i128),
        (winner2.clone(), 40_0000000_i128),
    ];
    client.settle(&recipients);

    assert!(client.is_settled());
    assert_eq!(client.balance(), 0_i128);
    assert_eq!(usdc.balance(&winner1), 60_0000000_i128);
    assert_eq!(usdc.balance(&winner2), 40_0000000_i128);
}

#[test]
fn test_refund() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let brand = Address::generate(&env);
    let (usdc, usdc_admin) = create_token(&env, &admin);

    usdc_admin.mint(&brand, &500_0000000_i128);

    let contract_id = env.register(EscrowContract, ());
    let client = EscrowContractClient::new(&env, &contract_id);

    client.initialize(&admin, &usdc.address, &String::from_str(&env, "BLITZ-XYZ999"));
    client.deposit(&brand, &200_0000000_i128);

    assert_eq!(usdc.balance(&brand), 300_0000000_i128);

    client.refund();

    assert!(client.is_settled());
    assert_eq!(client.balance(), 0);
    // Brand gets full refund
    assert_eq!(usdc.balance(&brand), 500_0000000_i128);
}

#[test]
#[should_panic(expected = "already settled")]
fn test_double_settle_fails() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let brand = Address::generate(&env);
    let winner = Address::generate(&env);
    let (usdc, usdc_admin) = create_token(&env, &admin);

    usdc_admin.mint(&brand, &100_0000000_i128);

    let contract_id = env.register(EscrowContract, ());
    let client = EscrowContractClient::new(&env, &contract_id);

    client.initialize(&admin, &usdc.address, &String::from_str(&env, "BLITZ-DUP"));
    client.deposit(&brand, &100_0000000_i128);

    let recipients = vec![&env, (winner.clone(), 100_0000000_i128)];
    client.settle(&recipients);

    // Should panic
    client.settle(&recipients);
}
