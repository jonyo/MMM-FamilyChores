export const API_BASE_URL = '/MMM-FamilyChores';

export const handleResponse = async (response: Response): Promise<unknown> => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    if (errorData?.error) {
      throw new Error(errorData.error);
    }
    throw new Error(`Request failed with status ${response.status}`);
  }
  return response.json();
};
