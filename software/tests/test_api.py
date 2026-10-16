import urllib.request
import json

def req(url, method='GET', data=None):
    headers = {'Content-Type': 'application/json'} if data else {}
    body = json.dumps(data).encode('utf-8') if data else None
    request = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(request) as response:
            return response.status, json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode('utf-8'))

def run_tests():
    print("=== 1. Testing GET /api/products ===")
    status, prods = req("http://127.0.0.1:8000/api/products")
    assert status == 200 and len(prods) == 6, f"Failed: {status}, {len(prods)}"
    print(f"Passed: {len(prods)} products retrieved.")

    print("=== 2. Testing GET /api/analytics ===")
    status, an = req("http://127.0.0.1:8000/api/analytics")
    assert an["total_valuation"] == 19460.0
    assert an["total_sales_today"] == 0.0
    assert an["critical_stock_count"] == 2
    print("Passed: Analytics matched (Valuation: 19460.0, Critical items: 2).")

    print("=== 3. Testing POST /api/checkout ===")
    checkout_payload = {
        "items": [{"product_id": 1, "quantity": 2}, {"product_id": 2, "quantity": 1}],
        "discount_type": "fixed",
        "discount_value": 10.0
    }
    status, order = req("http://127.0.0.1:8000/api/checkout", method="POST", data=checkout_payload)
    assert status == 200, f"Checkout error: {order}"
    assert order["invoice_id"] == "INV-1001"
    assert order["subtotal"] == 1410.0
    assert order["discount_amount"] == 10.0
    assert order["tax_amount"] == 70.0
    assert order["grand_total"] == 1470.0
    print(f"Passed: Order created {order['invoice_id']} with Grand Total Rs {order['grand_total']}")

    print("=== 4. Testing stock decrement ===")
    status, prods = req("http://127.0.0.1:8000/api/products")
    p1 = next(p for p in prods if p["id"] == 1)
    p2 = next(p for p in prods if p["id"] == 2)
    assert p1["stock"] == 23, f"Expected 23, got {p1['stock']}"
    assert p2["stock"] == 3, f"Expected 3, got {p2['stock']}"
    print("Passed: Stock decremented correctly (25->23, 4->3).")

    print("=== 5. Testing updated analytics ===")
    status, an2 = req("http://127.0.0.1:8000/api/analytics")
    assert an2["total_sales_today"] == 1470.0
    print("Passed: Total sales today updated to Rs 1470.0.")

    print("=== 6. Testing Restock ===")
    status, restocked = req("http://127.0.0.1:8000/api/products/2/restock", method="POST", data={"amount": 10})
    assert status == 200
    assert restocked["stock"] == 13
    assert restocked["is_low_stock"] is False
    print("Passed: Restock updated stock from 3 to 13, low stock flag cleared.")

    print("=== 7. Testing Over-Stock Prevention ===")
    over_payload = {"items": [{"product_id": 1, "quantity": 999}]}
    status, err = req("http://127.0.0.1:8000/api/checkout", method="POST", data=over_payload)
    assert status == 400
    assert "Insufficient stock" in err["detail"]
    print("Passed: Over-stock correctly rejected with error:", err["detail"])

    print("=== 8. Resetting to initial demo data ===")
    status, reset_res = req("http://127.0.0.1:8000/api/reset-demo", method="POST")
    assert status == 200
    status, prods = req("http://127.0.0.1:8000/api/products")
    assert len(prods) == 6
    status, an3 = req("http://127.0.0.1:8000/api/analytics")
    assert an3["critical_stock_count"] == 2
    print("Passed: Reset restored the initial demo dataset.")
    print("\n>>> ALL 8 INTEGRATION TESTS PASSED 100%! <<<")

if __name__ == "__main__":
    run_tests()
