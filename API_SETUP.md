# Setting Up Real Pharmaceutical Data API

This application has been upgraded to support real pharmaceutical product data instead of the mock data that was previously used.

## API Configuration

To connect to a real pharmaceutical products API, follow these steps:

1. **Create an API key**: 
   - Register at your pharmaceutical data provider service
   - Request an API key with appropriate permissions

2. **Set up environment variables**:
   - Create a `.env.local` file in the root directory of the project
   - Add the following line to the file, replacing `your_actual_api_key` with your real API key:
     ```
     REACT_APP_PHARMA_API_KEY=your_actual_api_key
     ```

3. **Configure the API endpoint**:
   - If your API has a different base URL than the default one, update the `API_BASE_URL` constant in `src/utils/api.ts`

## Using Mock Data as Fallback

The application is designed to gracefully fall back to mock data in the following scenarios:
- The API key is missing or invalid
- The API endpoint is unreachable
- The API returns an error response

When using mock data, a "Using Mock Data" chip will be displayed in the dashboard to indicate that real data is not being used.

## Expected API Response Format

If you're integrating with a different pharmaceutical API, ensure that your API response is transformed to match the expected format:

```typescript
interface Product {
  id: string;
  ean: string;
  minsan: string; // Minsan code (Italian pharmaceutical code)
  name: string;
  description: string;
  manufacturer: string;
  category: string;
  publicPrice: number;
  vat: number;
  bestPrices: ProductPrice[];
  inStock: boolean;
}

interface ProductPrice {
  supplier: string;
  price: number;
  stock: number;
}
```

The API service in `src/utils/api.ts` contains transformation logic that you may need to update based on your specific API's response format.

## Troubleshooting

If you encounter issues with the API integration:

1. Check your API key is correctly set in the environment variables
2. Verify your API endpoint is accessible
3. Examine network requests in your browser's developer tools
4. Look for error messages in the console log
5. Add additional error handling in the API service as needed

---

For further assistance, consult the API provider's documentation or contact their support team. 