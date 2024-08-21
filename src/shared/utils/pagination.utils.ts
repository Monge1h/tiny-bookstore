export const paginateResult = (
  count: number,
  results: any[],
  limit: number,
  page: number,
  maxPageLinks = 5,
) => {
  if (
    !Number.isInteger(count) ||
    !Array.isArray(results) ||
    !Number.isInteger(limit) ||
    !Number.isInteger(page) ||
    !Number.isInteger(maxPageLinks)
  ) {
    throw new Error('Invalid input parameters');
  }
  const totalPages = Math.ceil(count / limit);
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const hasPreviousPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;
  const previousPage = hasPreviousPage ? currentPage - 1 : null;
  const nextPage = hasNextPage ? currentPage + 1 : null;
  const hasEllipsisBefore = currentPage > (maxPageLinks + 1) / 2;
  const hasEllipsisAfter = currentPage < totalPages - (maxPageLinks - 1) / 2;

  const pageLinks = [];
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - (maxPageLinks - 1) / 2 &&
        i <= currentPage + (maxPageLinks - 1) / 2)
    ) {
      pageLinks.push(i);
    } else if (
      (i === currentPage - (maxPageLinks - 1) / 2 - 1 && hasEllipsisBefore) ||
      (i === currentPage + (maxPageLinks - 1) / 2 + 1 && hasEllipsisAfter)
    ) {
      pageLinks.push('...');
    }
  }

  if (pageLinks[0] === '...' && pageLinks[1] !== '...' && pageLinks[1] !== 2) {
    pageLinks.shift();
  }

  if (
    pageLinks[pageLinks.length - 1] === '...' &&
    pageLinks[pageLinks.length - 2] !== '...' &&
    pageLinks[pageLinks.length - 2] !== totalPages - 1
  ) {
    pageLinks.pop();
  }

  return {
    results,
    totalRecords: count,
    totalPages,
    currentPage,
    hasPreviousPage,
    hasNextPage,
    previousPage,
    nextPage,
    hasEllipsisBefore,
    hasEllipsisAfter,
    pageLinks,
  };
};
