# Testing

Run the logic and regression suite with:

```bash
npm run test
```

This covers:

- Classic online server authority and reconnect recovery
- Classic move reducer behavior
- Classic replay reducer behavior
- Authentic `SANGUO_YANYI_QI_V1` rules coverage
- Authentic replay reducer behavior

Run browser coverage with:

```bash
npm run test:e2e
```

This covers:

- route and navigation smoke tests
- Classic local gameplay smoke
- Modern 3K local gameplay smoke
- archive replay smoke
- Classic online 2-tab room flow

Static verification remains:

```bash
npm run lint
npm run build
```

CI runs `test`, `lint`, `build`, and `test:e2e` on every main push and pull request.
