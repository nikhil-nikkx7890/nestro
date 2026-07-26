export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
}) {
  return (
    <div className="group rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">

      <div className="flex items-start justify-between">

        <div>

          <p className="text-sm font-medium text-neutral-500">
            {title}
          </p>

          <h2 className="mt-3 text-4xl font-bold tracking-tight text-neutral-900">
            {value}
          </h2>

          {subtitle && (
            <p className="mt-2 text-sm text-neutral-500">
              {subtitle}
            </p>
          )}

        </div>

        {Icon && (
          <div className="rounded-2xl bg-neutral-100 p-3 transition group-hover:bg-neutral-900 group-hover:text-white">
            <Icon size={24} />
          </div>
        )}

      </div>

    </div>
  );
}