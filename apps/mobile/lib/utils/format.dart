// 与 web 端 utils/format.ts 等价的工具函数。
const _frMonths = [
  'NIVÔSE', 'PLUVIÔSE', 'VENTÔSE', 'GERMINAL', 'FLORÉAL', 'PRAIRIAL',
  'MESSIDOR', 'THERMIDOR', 'FRUCTIDOR', 'VENDÉMIAIRE', 'BRUMAIRE', 'FRIMAIRE',
];

String frenchSeason(DateTime? d) {
  if (d == null) return '';
  return _frMonths[d.month - 1];
}

String readingTime(String content) {
  final minutes = (content.length / 400).ceil().clamp(1, 999);
  return '$minutes min read';
}

String shortDate(DateTime d) {
  final mm = d.month.toString().padLeft(2, '0');
  final dd = d.day.toString().padLeft(2, '0');
  return '${d.year}-$mm-$dd';
}
