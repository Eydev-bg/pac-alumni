// ═══════════════════════════════════════════════════════════
//  FILE: frontend/src/pages/admin/graduates/ImportGuideModal.jsx
//  "Before You Import Graduates" instructional guide. Explains the
//  Department → Course → Excel → Level → Upload workflow before the
//  admin uploads a file. Purely instructional — does not replace or
//  duplicate the existing department/course/import validation.
// ═══════════════════════════════════════════════════════════

import { useNavigate } from "react-router-dom";
import Modal from "../../../ui/Modal";
import Button from "../../../ui/Button";
import { downloadGraduateImportTemplate } from "../../../utils/graduateImportTemplate";
import { HiOutlineDocumentArrowDown } from "react-icons/hi2";

function GuideStep({ number, title, badge, children }) {
  return (
    <li className="flex gap-4">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/10 dark:bg-gold-500/10 border border-blue-500/20 dark:border-gold-500/20 text-blue-600 dark:text-gold-500 font-bold flex items-center justify-center text-sm">
        {number}
      </div>
      <div className="flex-1 min-w-0 pb-1">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white">
            {title}
          </h3>
          {badge && (
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              {badge}
            </span>
          )}
        </div>
        <div className="text-sm text-slate-500 dark:text-slate-400 space-y-2">
          {children}
        </div>
      </div>
    </li>
  );
}

export default function ImportGuideModal({ open, onClose }) {
  const navigate = useNavigate();

  const goToDepartments = () => {
    onClose();
    navigate("/admin/departments");
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Before You Import Graduates"
      footer={
        <Button
          onClick={() => onClose()}
          className="w-full sm:w-auto sm:ml-auto"
        >
          Got It, Continue
        </Button>
      }
    >
      <p className="text-sm text-slate-500 dark:text-slate-400 -mt-3 mb-5">
        Complete these steps before uploading your graduate list.
      </p>

      <ol className="space-y-5">
        <GuideStep number={1} title="Create a Department">
          <p>
            Create the appropriate department first from Departments management
            - e.g. an Elementary, JHS, SHS, or College department.
          </p>
          <Button size="sm" variant="secondary" onClick={goToDepartments}>
            Go to Departments
          </Button>
        </GuideStep>

        <GuideStep
          number={2}
          title="Create Courses Under the Department"
          badge="College only"
        >
          <p>
            If you're importing College graduates, open the department you
            created and add the appropriate courses under it - e.g. a Computer
            department with BSIT and BSCS courses.
          </p>
          <p>
            The{" "}
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              course_code
            </span>{" "}
            in your College Excel file must match an existing course (or
            department code) in the system.
          </p>
          <Button size="sm" variant="secondary" onClick={goToDepartments}>
            Go to Departments
          </Button>
        </GuideStep>

        <GuideStep number={3} title="Prepare Your Excel File">
          <p>Use the required column names and format below.</p>
          <div className="bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] rounded-xl p-3 space-y-1">
            <p>
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                Required:
              </span>{" "}
              first_name, last_name, graduation_year
            </p>
            <p>
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                Optional:
              </span>{" "}
              middle_name, suffix
            </p>
            <p>
              <span className="font-semibold text-blue-600 dark:text-gold-500">
                College only:
              </span>{" "}
              course_code (required), alumni_id (optional - leave blank to
              auto-generate)
            </p>
          </div>
          <p className="text-xs">Supports .xlsx, .xls, .csv - max 10MB.</p>
          <Button
            size="sm"
            variant="secondary"
            icon={HiOutlineDocumentArrowDown}
            onClick={() => downloadGraduateImportTemplate()}
          >
            Download Excel Template
          </Button>
        </GuideStep>

        <GuideStep number={4} title="Select the Education Level">
          <p>
            Choose Elementary, JHS, SHS, or College - whichever matches the
            graduate list you're importing.
          </p>
        </GuideStep>

        <GuideStep number={5} title="Upload and Import">
          <p>
            Upload your prepared Excel/CSV file. The existing validation and
            import process handles the rest.
          </p>
        </GuideStep>
      </ol>
    </Modal>
  );
}
