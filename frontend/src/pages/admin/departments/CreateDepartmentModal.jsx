import { useState } from "react";
import adminApi from "../../../api/adminApi";
import { useToast } from "../../../hooks/useToast";
import { EDUCATION_LEVELS } from "../../../config/departmentOptions";
import Modal from "../../../ui/Modal";
import Button from "../../../ui/Button";
import Input from "../../../ui/Input";
import Select from "../../../ui/Select";
import Alert from "../../../ui/Alert";

export default function CreateDepartmentModal({ onClose, onCreated }) {
  const toast = useToast();
  const [form, setForm] = useState({
    name: "",
    code: "",
    education_level: "college",
    is_board_program: false,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const isCollege = form.education_level === "college";

  const handleChange = (field, value) => {
    setForm((prev) => {
      const updated = { ...prev, [field]: value };
      // Reset board program if switching away from college
      if (field === "education_level" && value !== "college") {
        updated.is_board_program = false;
      }
      return updated;
    });
    if (errors[field]) {
      setErrors((prev) => {
        const n = { ...prev };
        delete n[field];
        return n;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      await adminApi.createDepartment(form);
      toast.success("Department created successfully.");
      onCreated();
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {});
      } else {
        setErrors({
          general:
            err.response?.data?.message || "Failed to create department.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const selectedLevel = EDUCATION_LEVELS.find(
    (l) => l.value === form.education_level,
  );

  const namePlaceholder = isCollege
    ? "e.g., Computer Department"
    : form.education_level === "elementary"
      ? "e.g., Elementary Department"
      : form.education_level === "jhs"
        ? "e.g., Junior High School Department"
        : "e.g., Senior High School Department";

  const codePlaceholder = isCollege
    ? "e.g., CD"
    : form.education_level === "elementary"
      ? "e.g., ELEM"
      : form.education_level === "jhs"
        ? "e.g., JHS"
        : "e.g., SHS";

  return (
    <Modal open onClose={onClose} title="Create Department" size="md">
      {errors.general && (
        <Alert variant="error" className="mb-4">
          {errors.general}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          tone="dark"
          label="Education Level"
          required
          value={form.education_level}
          onChange={(e) => handleChange("education_level", e.target.value)}
          hint={selectedLevel?.description}
          error={errors.education_level}
          options={EDUCATION_LEVELS.map((l) => ({
            value: l.value,
            label: l.label,
          }))}
        />

        <Input
          tone="dark"
          label="Department Name"
          required
          value={form.name}
          onChange={(e) => handleChange("name", e.target.value)}
          placeholder={namePlaceholder}
          error={errors.name}
        />

        <Input
          tone="dark"
          label="Department Code"
          required
          value={form.code}
          onChange={(e) => handleChange("code", e.target.value.toUpperCase())}
          placeholder={codePlaceholder}
          maxLength={20}
          className="font-mono"
          hint="Letters and numbers only, no spaces"
          error={errors.code}
        />

        {/* Info box */}
        <div className="bg-white/[0.04] border border-white/[0.06] rounded-lg p-3">
          {isCollege ? (
            <p className="text-xs text-slate-400">
              Board program settings are managed per Course, not per Department.
              Create a Department first, then click the Department name to
              manage and add Courses under it.
            </p>
          ) : (
            <p className="text-xs text-slate-400">
              {form.education_level === "elementary"
                ? "This department supports Graduate List and Graduation Trend tracking only."
                : "This department supports Graduate List and Graduation Trend tracking only."}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            {loading ? "Creating..." : "Create Department"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
