import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card.jsx";
import Button from "../../components/ui/button/Button.jsx";
import { Input } from "../../components/ui/input.jsx";
import { Label } from "../../components/ui/label.jsx";
import apiFetch from "../../../api.js";



export default function UserAddressCard() {
  const [formData, setFormData] = useState({
    country: "",
    city_state: "",
    postal_code: "",
    tax_id: "",
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch profile data on mount
    const fetchProfile = async () => {
      try {
        const res = await apiFetch("/api/admin/profile");
        if (res.profile) {
          setFormData((prev) => ({
            ...prev,
            ...res.profile,
          }));
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await apiFetch("/api/admin/profile", {
        method: "PUT",
        body: JSON.stringify(formData),
      });
      alert("Address updated successfully!");
    } catch (err) {
      console.error("Error updating address:", err);
      alert("Error updating address");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-md rounded-2xl">
      <CardHeader>
        <CardTitle>Address Information</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div>
            <Label>Country</Label>
            <Input
              name="country"
              value={formData.country}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label>City / State</Label>
            <Input
              name="city_state"
              value={formData.city_state}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label>Postal Code</Label>
            <Input
              name="postal_code"
              value={formData.postal_code}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label>Tax ID</Label>
            <Input
              name="tax_id"
              value={formData.tax_id}
              onChange={handleChange}
            />
          </div>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
