# VestRoll

<p align="center">
  <a href="https://github.com/SafeVault/vestroll/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License"></a>
  <a href="https://stellar.expert/explorer/testnet/"><img src="https://img.shields.io/badge/network-testnet-purple" alt="Testnet"></a>
  <a href="https://stellar.expert/explorer/public/"><img src="https://img.shields.io/badge/network-mainnet-green" alt="Mainnet"></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-20.x-green?style=for-the-badge&logo=node.js" alt="Node.js 20" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-blue?style=for-the-badge&logo=typescript" alt="TS 5" />
  <img src="https://img.shields.io/badge/Next.js-15.x-black?style=for-the-badge&logo=next.js" alt="Next.js 15" />
  <img src="https://img.shields.io/badge/Drizzle-ORM-teal?style=for-the-badge&logo=drizzle" alt="Drizzle" />
  <img src="https://img.shields.io/badge/Stellar-Wallet-black?style=for-the-badge&logo=stellar" alt="Stellar" />
</p>

**VestRoll** is a professional payroll and invoicing system built on the Stellar network. It enables businesses, contractors, and individuals to manage global payments with automated tax handling using both fiat and stablecoins.

## Features

- **Hybrid Payments**: Full support for fiat and stablecoins (USDC) for global settlement.
- **Payroll Management**: Automated disbursement of payments to large teams in seconds.
- **Invoice as a Service**: Specialized infrastructure for generating and tracking invoices on Stellar.
- **Tax Handling**: Integrated tax calculations and reporting for every transaction.
- **Multi-Account Support**: Tailored experiences for Business, Contractor, and Individual accounts.

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (Frontend & API)
- **Runtime**: Node.js 20 LTS
- **Database**: PostgreSQL (via Drizzle ORM)
- **Blockchain**: Stellar Network (SEP-24, Passkey Kit)
- **State Management**: Redux Toolkit & Zustand

## Quick Start

1. **Clone and Prepare**:

   ```bash
   git clone https://github.com/SafeVault/vestroll.git
   cd vestroll
   cp .env.example .env
   ```

2. **Install Dependencies**:

   ```bash
   pnpm install
   ```

3. **Database Setup**:

   ```bash
   pnpm drizzle-kit push
   ```

4. **Run in Development**:
   ```bash
   pnpm dev
   ```

## Project Structure

```
vestroll/
├── src/
│   ├── app/                # Next.js App Router (Pages & API)
│   ├── components/         # UI Components (Shadcn UI)
│   ├── server/
│   │   ├── services/       # Business Logic (Payroll, Tax, Stellar)
│   │   └── db/             # Drizzle Schema & Migrations
│   └── lib/                # Shared utilities & SDK wrappers
├── docs/                   # Comprehensive documentation
├── public/                 # Static assets
└── scripts/                # Utility scripts for DB and Swagger
```

## Documentation

Comprehensive documentation is available in the [`/docs`](./docs/) folder:

### Quick Start

- **[Main Documentation](./docs/README.md)** - Complete documentation index

### Core Documentation

- [Architecture Overview](./docs/architecture/overview.md) - System architecture
- [Project Overview](./docs/context/project-overview.md) - Vision and goals
- [User Personas](./docs/context/user-personas.md) - Account types and use cases

## Use Cases

### Business Payroll

Manage organizational payroll with ease:

1. Deposit funds via fiat or stablecoin.
2. Automate tax deductions based on jurisdiction.
3. Disburse payments to contractors and employees instantly.

### Contractor Invoicing

Generate professional invoices and get paid:

1. Create invoices as a service on Stellar.
2. Receive payments in stablecoins for low-fee global settlement.
3. Track payment status and tax obligations.

### Individual Payments

Simple and secure personal payment management:

1. Manage personal balances in fiat or stablecoins.
2. Secure onboarding with biometric Passkeys.

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## Support

- **Documentation**: [/docs](./docs/)
- **Issues**: [GitHub Issues](https://github.com/SafeVault/vestroll/issues)

## 👥 Maintainers

<table align="center">
  <tr>
    <td align="center">
      <img src="https://github.com/codeze-us.png" alt="codeZe-us" width="150" />
      <br /><br />
      <strong>codeZe-us</strong>
      <br /><br />
      <a href="https://github.com/codeze-us" target="_blank">GitHub</a>
    </td>
  </tr>
</table>

---

## **Thanks to all the contributors who have made this project possible!**

[![Contributors](https://contrib.rocks/image?repo=SafeVault/vestroll)](https://github.com/SafeVault/vestroll/graphs/contributors)

---

<p align="center">
  <i> Empowering global payroll with Stellar </i>
</p>

---
