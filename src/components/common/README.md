# Common Components and Utilities

This directory contains reusable components and utilities that can be used throughout the application.

## Directory Structure

- `reusable/`: Contains reusable UI components
- `utils/`: Contains utility functions and helpers

## Reusable Components

### PriceDisplay

A component that displays price information with discount percentages, VAT calculations, and stock availability.

**Usage:**
```jsx
import { PriceDisplay } from '../common/reusable';

<PriceDisplay
  publicPrice={100}
  supplierPrice={80}
  vatRate={10}
  stock={25}
  backgroundColor="#e8f5e9"
  showNetVAT={true}
/>
```

### StockAvailability

A component that displays the total stock availability across all suppliers.

**Usage:**
```jsx
import { StockAvailability } from '../common/reusable';

<StockAvailability
  bestPrices={[
    { price: 10, stock: 5 },
    { price: 12, stock: 10 }
  ]}
/>
```

### ProductRow

A comprehensive component that renders a product row in the products table, with all necessary cells and interactive elements.

**Usage:**
```jsx
import { ProductRow } from '../common/reusable';

<ProductRow
  product={product}
  index={index}
  isSelected={isSelected}
  page={page}
  rowsPerPage={rowsPerPage}
  onSelectClick={handleSelectClick}
  onQuantityChange={handleQuantityChange}
  onTargetPriceChange={handleTargetPriceChange}
  onToggleAllPrices={handleToggleAllPrices}
  usingMockData={usingMockData}
/>
```

### StickyTableCell

A reusable table cell component that provides consistent sticky positioning and styling.

**Usage:**
```jsx
import { StickyTableCell } from '../common/reusable';

<StickyTableCell
  leftPosition={90}
  isHeader={false}
  backgroundColor="#f9f9f9"
  minWidth={160}
  zIndex={2}
  hasBorder={true}
>
  Content here
</StickyTableCell>
```

### QuantityInput

A reusable component for quantity input fields with validation and styling.

**Usage:**
```jsx
import { QuantityInput } from '../common/reusable';

<QuantityInput
  value={quantity}
  onChange={handleQuantityChange}
  isExceeded={stockExceeded}
  width={100}
  min={0}
  step={1}
/>
```

### PriceInput

A reusable component for price input fields with currency symbol.

**Usage:**
```jsx
import { PriceInput } from '../common/reusable';

<PriceInput
  value={targetPrice}
  onChange={handleTargetPriceChange}
  placeholder="€ Target"
  currencySymbol="€"
  min={0}
  step={0.01}
/>
```

### StockWarningIndicator

A component that displays a warning indicator when the requested quantity exceeds available stock.

**Usage:**
```jsx
import { StockWarningIndicator } from '../common/reusable';

<StockWarningIndicator
  quantity={quantity}
  availableStock={totalStock}
/>
```

### ProductInfo

A component that displays product name, manufacturer, and stock status.

**Usage:**
```jsx
import { ProductInfo } from '../common/reusable';

<ProductInfo
  name={product.name}
  manufacturer={product.manufacturer}
  inStock={product.inStock}
/>
```

### ProductCodes

A component that displays product code information (EAN and Minsan).

**Usage:**
```jsx
import { ProductCodes } from '../common/reusable';

<ProductCodes
  ean={product.ean}
  minsan={product.minsan}
/>
```

### PublicPriceDisplay

A component that displays product public price with VAT information.

**Usage:**
```jsx
import { PublicPriceDisplay } from '../common/reusable';

<PublicPriceDisplay
  price={product.publicPrice}
  vatRate={product.vat}
/>
```

### AveragePriceDisplay

A component that displays average price information with warnings when stock is exceeded.

**Usage:**
```jsx
import { AveragePriceDisplay } from '../common/reusable';

<AveragePriceDisplay
  averagePrice={product.averagePrice}
  quantity={product.quantity}
  isStockExceeded={stockExceeded}
/>
```

### ShowMorePricesButton

A component that displays a button to toggle showing more prices.

**Usage:**
```jsx
import { ShowMorePricesButton } from '../common/reusable';

<ShowMorePricesButton
  showAllPrices={product.showAllPrices}
  additionalPricesCount={product.bestPrices.length - 3}
  onClick={handleShowMoreClick}
/>
```

## Utility Functions

### priceCalculations.ts

Contains various functions for calculating prices, percentages, and stock availability:

- `calculatePriceDifferencePercent`: Calculates the percentage difference between public and supplier price
- `calculatePriceDifferencePercentNetVAT`: Calculates the percentage difference after removing VAT
- `calculateAveragePrice`: Calculates the average price based on quantity and available supplier stocks
- `getTotalAvailableStock`: Gets the total stock available across all suppliers
- `isStockExceeded`: Checks if the requested quantity exceeds available stock

**Usage:**
```jsx
import { calculateAveragePrice, isStockExceeded } from '../common/utils';

const averagePrice = calculateAveragePrice(product.bestPrices, quantity, product.publicPrice);
const stockExceeded = isStockExceeded(quantity, product.bestPrices);
```

### tableLayout.ts

Contains utilities for consistent table layout positioning and styling:

- `tableCellPositions`: Default cell positions for the product table
- `tableCellWidths`: Default cell widths for the product table
- `supplierPriceColors`: Background colors for supplier price columns
- `getRowBackgroundColor`: Get background color based on row state
- `getRowHoverStyles`: Get hover styles based on row state

**Usage:**
```jsx
import { 
  tableCellPositions,
  tableCellWidths,
  supplierPriceColors,
  getRowBackgroundColor,
  getRowHoverStyles 
} from '../common/utils';

const bgColor = getRowBackgroundColor(isSelected, isStockExceeded);
const hoverStyles = getRowHoverStyles(isStockExceeded);
``` 