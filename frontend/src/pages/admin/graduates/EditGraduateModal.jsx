import { useState, useEffect } from "react";
import adminApi from "../../../api/adminApi";
import { useToast } from "../../../hooks/useToast";
import Modal from "../../../ui/Modal";
import Button from "../../../ui/Button";
import Input from "../../../ui/Input";
import Select from "../../../ui/Select";
import Alert from "../../../ui/Alert";

export default function EditGraduateModal({ graduate, onClose, onUpdated }) {
  const toast = useToast();
  const [form, setForm] = useState({
    first_name: graduate.first_name || "",
    middle_name: graduate.middle_name || "",
    last_name: graduate.last_name || "",
    suffix: graduate.suffix || "",
    graduation_year: graduate.graduation_year || "",
    course_id: graduate.course?.id || "",
  });
  const [courses, setCourses] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    adminApi
      .getAllCourses()
      .then((res) => setCourses(res.data.data))
      .catch(() => {});
  }, []);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
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
      const payload = { ...form };
      if (!payload.course_id) payload.course_id = null;
      await adminApi.updateGraduate(graduate.id, payload);
      toast.success("Graduate updated.");
      onUpdated();
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {});
      } else {
        setErrors({
          general: err.response?.data?.message || "Failed to update.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const isCollege = graduate.education_level === "college";

  return (
    <Modal open onClose={onClose} title="Edit Graduate" size="md">
      {errors.general && (
        <Alert variant="error" className="mb-4">
          {errors.general}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input
            tone="dark"
            label="First Name"
            required
            value={form.first_name}
            onChange={(e) => handleChange("first_name", e.target.value)}
            error={errors.first_name}
          />
          <Input
            tone="dark"
            label="Last Name"
            required
            value={form.last_name}
            onChange={(e) => handleChange("last_name", e.target.value)}
            error={errors.last_name}
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <Input
              tone="dark"
              label="Middle Name"
              value={form.middle_name}
              onChange={(e) => handleChange("middle_name", e.target.value)}
              error={errors.middle_name}
            />
          </div>
          <Input
            tone="dark"
            label="Suffix"
            placeholder="Jr, Sr"
            value={form.suffix}
            onChange={(e) => handleChange("suffix", e.target.value)}
            error={errors.suffix}
          />
        </div>

        <Input
          tone="dark"
          label="Graduation Year"
          type="number"
          required
          min="1950"
          max="2099"
          value={form.graduation_year}
          onChange={(e) => handleChange("graduation_year", e.target.value)}
          error={errors.graduation_year}
        />

        {isCollege && (
          <Select
            tone="dark"
            label="Course"
            value={form.course_id}
            onChange={(e) => handleChange("course_id", e.target.value)}
            error={errors.course_id}
            placeholder="No course"
            options={courses.map((c) => ({ value: c.id, label: c.name }))}
          />
        )}

        <div className="bg-white/[0.04] border border-white/[0.06] rounded-lg p-3">
          <p className="text-xs text-slate-400">
            <span className="font-medium">Education Level:</span>{" "}
            {graduate.education_level_label} (cannot be changed)
          </p>
          {graduate.alumni_id_number && (
            <p className="text-xs text-slate-400 mt-1">
              <span className="font-medium">Alumni ID:</span>{" "}
              {graduate.alumni_id_number} (auto-generated, cannot be changed)
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
