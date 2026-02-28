export const formatFechaAsistencia = (isoString: string): string => {
  const fecha = new Date(isoString);

  // Formateador para la fecha: 27 de Feb
  const fechaFormateada = fecha.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
  });

  // Formateador para la hora: 6:30 PM
  const horaFormateada = fecha.toLocaleTimeString('es-PE', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return `${fechaFormateada}, ${horaFormateada}`;
};