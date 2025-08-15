import type {ZodSafeParseResult, ZodType} from "zod";

export async function safeParseFormData<T>(request: Request, schema: ZodType<T>): Promise<ZodSafeParseResult<T>> {
	return request.formData().then(formData => {
		const obj = Object.fromEntries(formData.entries());
		return schema.safeParseAsync(obj)
	});
}