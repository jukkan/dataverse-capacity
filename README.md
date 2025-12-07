# Dataverse Capacity Calculator

An interactive web-based calculator for estimating Microsoft Dataverse capacity based on Power Platform and Dynamics 365 product licenses.

[**OPEN CALCULATOR**](https://dataverse.licensing.guide/)

[Read intro blog post](https://licensing.guide/december-2025-dataverse-default-capacity-changes-illustrated/)

![Dataverse Capacity Calculator](https://github.com/user-attachments/assets/95933195-0fc4-4b56-b3f2-2a84013a2408)

## Features

- **Interactive Product Selection**: Choose from all major Dynamics 365 and Power Platform products
- **Real-time Calculations**: See capacity updates instantly as you add products and adjust user counts
- **Visual Capacity Gauges**: Clear visualization of default vs. per-user capacity allocation
- **Detailed Breakdown Table**: Line-by-line breakdown of capacity contributions
- **Helpful Tooltips**: Hover over products to see capacity details
- **"How it Works" Guide**: Built-in explanation of Dataverse capacity licensing
- **Mobile Responsive**: Works on desktop and mobile devices
- **Print-friendly**: Clean output for printing or sharing

## Capacity Calculation

### How Capacity Works

1. **Default Capacity**: When you license any Dataverse product, your tenant receives a one-time default capacity allocation. The highest tier product determines this amount.

2. **Per-User Accrual**: Many products add additional capacity for each licensed user. This stacks across all products.

3. **Tier Priority** (highest to lowest):
   - D365 ERP Premium (125 GB DB / 110 GB File)
   - D365 ERP Standard (90 GB DB / 80 GB File)
   - D365 CRM (30 GB DB / 40 GB File)
   - Power Platform Premium (20 GB DB / 40 GB File)
   - Power Platform Workload (15 GB DB / 20 GB File)

## Development

### Prerequisites

- Node.js 18+ 
- npm

### Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework

## Deployment

The site automatically deploys to GitHub Pages when changes are pushed to the `main` branch via GitHub Actions.

**Live Site**: [https://dataverse.licensing.guide/](https://dataverse.licensing.guide/)

## Disclaimer

This calculator provides estimates based on publicly available licensing information (December 2025 values). Always verify actual entitlements in the [Power Platform Admin Center](https://admin.powerplatform.microsoft.com/).

## Resources

- [Microsoft licensing guides and docs](https://licensing.guide/resources/)
