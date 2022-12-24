/**
 * @since 1.0.0
 */

import { pipe } from "@fp-ts/data/Function"
import type { Json } from "@fp-ts/data/Json"
import type { Option } from "@fp-ts/data/Option"
import type { Refinement } from "@fp-ts/data/Predicate"
import type { Arbitrary } from "@fp-ts/schema/Arbitrary"
import * as AST from "@fp-ts/schema/AST"
import * as DataEndsWith from "@fp-ts/schema/data/filter/EndsWith"
import * as DataFinite from "@fp-ts/schema/data/filter/Finite"
import * as DataGreaterThan from "@fp-ts/schema/data/filter/GreaterThan"
import * as DataGreaterThanOrEqualTo from "@fp-ts/schema/data/filter/GreaterThanOrEqualTo"
import * as DataInstanceOf from "@fp-ts/schema/data/filter/InstanceOf"
import type { Class } from "@fp-ts/schema/data/filter/InstanceOf"
import * as DataInt from "@fp-ts/schema/data/filter/Int"
import * as DataLessThan from "@fp-ts/schema/data/filter/LessThan"
import * as DataLessThanOrEqualTo from "@fp-ts/schema/data/filter/LessThanOrEqualTo"
import * as DataMaxLength from "@fp-ts/schema/data/filter/MaxLength"
import * as DataMinLength from "@fp-ts/schema/data/filter/MinLength"
import * as DataNonNaN from "@fp-ts/schema/data/filter/NonNaN"
import * as DataRegex from "@fp-ts/schema/data/filter/Regex"
import * as DataStartsWith from "@fp-ts/schema/data/filter/StartsWith"
import * as DataJson from "@fp-ts/schema/data/Json"
import * as DataOption from "@fp-ts/schema/data/Option"
import * as DataParse from "@fp-ts/schema/data/parse"
import type { Decoder } from "@fp-ts/schema/Decoder"
import type { Encoder } from "@fp-ts/schema/Encoder"
import * as I from "@fp-ts/schema/internal/common"
import type { Pretty } from "@fp-ts/schema/Pretty"

/**
 * @since 1.0.0
 */
export interface Schema<A> {
  readonly A: (_: A) => A
  readonly ast: AST.AST
}

/**
 * @since 1.0.0
 */
export type Infer<S extends Schema<any>> = Parameters<S["A"]>[0]

// ---------------------------------------------
// constructors
// ---------------------------------------------

/**
 * @since 1.0.0
 */
export const make: <A>(ast: AST.AST) => Schema<A> = I.makeSchema

/**
 * @since 1.0.0
 */
export const literal: <Literals extends ReadonlyArray<AST.Literal>>(
  ...literals: Literals
) => Schema<Literals[number]> = I.literal

/**
 * @since 1.0.0
 */
export const uniqueSymbol: <S extends symbol>(symbol: S) => Schema<S> = I.uniqueSymbol

/**
 * @since 1.0.0
 */
export const enums = <A extends { [x: string]: string | number }>(enums: A): Schema<A[keyof A]> =>
  make(
    AST.enums(
      Object.keys(enums).filter(
        (key) => typeof enums[enums[key]] !== "number"
      ).map((key) => [key, enums[key]])
    )
  )

// ---------------------------------------------
// filters
// ---------------------------------------------

/**
 * @since 1.0.0
 */
export const minLength: (minLength: number) => <A extends string>(self: Schema<A>) => Schema<A> =
  DataMinLength.minLength

/**
 * @since 1.0.0
 */
export const maxLength: (maxLength: number) => <A extends string>(self: Schema<A>) => Schema<A> =
  DataMaxLength.maxLength

/**
 * @since 1.0.0
 */
export const length = (length: number) =>
  <A extends string>(self: Schema<A>): Schema<A> => minLength(length)(maxLength(length)(self))

/**
 * @since 1.0.0
 */
export const nonEmpty: <A extends string>(self: Schema<A>) => Schema<A> = minLength(1)

/**
 * @since 1.0.0
 */
export const startsWith: (startsWith: string) => <A extends string>(self: Schema<A>) => Schema<A> =
  DataStartsWith.startsWith

/**
 * @since 1.0.0
 */
export const endsWith: (endsWith: string) => <A extends string>(self: Schema<A>) => Schema<A> =
  DataEndsWith.endsWith

/**
 * @since 1.0.0
 */
export const regex: (regex: RegExp) => <A extends string>(self: Schema<A>) => Schema<A> =
  DataRegex.regex

/**
 * @since 1.0.0
 */
export const lessThan: (max: number) => <A extends number>(self: Schema<A>) => Schema<A> =
  DataLessThan.lessThan

/**
 * @since 1.0.0
 */
export const lessThanOrEqualTo: (max: number) => <A extends number>(self: Schema<A>) => Schema<A> =
  DataLessThanOrEqualTo.lessThanOrEqualTo

/**
 * @since 1.0.0
 */
export const greaterThan: (
  min: number
) => <A extends number>(self: Schema<A>) => Schema<A> = DataGreaterThan.greaterThan

/**
 * @since 1.0.0
 */
export const greaterThanOrEqualTo: (
  min: number
) => <A extends number>(self: Schema<A>) => Schema<A> =
  DataGreaterThanOrEqualTo.greaterThanOrEqualTo

/**
 * @since 1.0.0
 */
export const int: <A extends number>(self: Schema<A>) => Schema<A> = DataInt.int

/**
 * @since 1.0.0
 */
export const nonNaN: <A extends number>(self: Schema<A>) => Schema<A> = DataNonNaN.nonNaN

/**
 * @since 1.0.0
 */
export const finite: <A extends number>(self: Schema<A>) => Schema<A> = DataFinite.finite

/**
 * @since 1.0.0
 */
export const instanceOf: <A extends typeof Class>(
  constructor: A
) => (self: Schema<object>) => Schema<InstanceType<A>> = DataInstanceOf.instanceOf

// ---------------------------------------------
// combinators
// ---------------------------------------------

/**
 * @since 1.0.0
 */
export const allowUnexpected = <A>(self: Schema<A>): Schema<A> =>
  AST.isStruct(self.ast) || AST.isTuple(self.ast) ?
    make({ ...self.ast, allowUnexpected: true }) :
    self

/**
 * @since 1.0.0
 */
export const disallowUnexpected = <A>(self: Schema<A>): Schema<A> =>
  AST.isStruct(self.ast) ?
    make({ ...self.ast, allowUnexpected: false }) :
    self

/**
 * @since 1.0.0
 */
export const union: <Members extends ReadonlyArray<Schema<any>>>(
  ...members: Members
) => Schema<Infer<Members[number]>> = I.union

/**
 * @since 1.0.0
 */
export const nullable = <A>(self: Schema<A>): Schema<A | null> => union(self, literal(null))

/**
 * @since 1.0.0
 */
export const keyof = <A>(schema: Schema<A>): Schema<keyof A> =>
  make(AST.union(AST.keyof(schema.ast)))

/**
 * @since 1.0.0
 */
export const tuple: <Elements extends ReadonlyArray<Schema<any>>>(
  ...elements: Elements
) => Schema<{ readonly [K in keyof Elements]: Infer<Elements[K]> }> = I.tuple

/**
 * @since 1.0.0
 */
export const rest = <R>(rest: Schema<R>) =>
  <A extends ReadonlyArray<any>>(self: Schema<A>): Schema<readonly [...A, ...Array<R>]> => {
    if (AST.isTuple(self.ast)) {
      return make(AST.appendRestElement(self.ast, rest.ast))
    }
    throw new Error("`rest` is not supported on this schema")
  }

/**
 * @since 1.0.0
 */
export const element = <E>(element: Schema<E>) =>
  <A extends ReadonlyArray<any>>(self: Schema<A>): Schema<readonly [...A, E]> => {
    if (AST.isTuple(self.ast)) {
      return make(AST.appendElement(self.ast, AST.element(element.ast, false)))
    }
    throw new Error("`element` is not supported on this schema")
  }

/**
 * @since 1.0.0
 */
export const optionalElement = <E>(element: Schema<E>) =>
  <A extends ReadonlyArray<any>>(self: Schema<A>): Schema<readonly [...A, E?]> => {
    if (AST.isTuple(self.ast)) {
      return make(AST.appendElement(self.ast, AST.element(element.ast, true)))
    }
    throw new Error("`optionalElement` is not supported on this schema")
  }

/**
 * @since 1.0.0
 */
export const array: <A>(item: Schema<A>) => Schema<ReadonlyArray<A>> = I.array

/**
 * @since 1.0.0
 */
export const nonEmptyArray = <A>(
  item: Schema<A>
): Schema<readonly [A, ...Array<A>]> => pipe(tuple(item), rest(item))

/**
 * @since 1.0.0
 */
export type Spread<A> = {
  [K in keyof A]: A[K]
} extends infer B ? B : never

/**
 * @since 1.0.0
 * @category symbol
 */
export type FieldSchemaId = typeof I.FieldSchemaId

/**
 * @since 1.0.0
 */
export interface OptionalSchema<A, isOptional extends boolean> extends Schema<A>, AST.Annotated {
  readonly _id: FieldSchemaId
  readonly isOptional: isOptional
}

/**
 * @since 1.0.0
 */
export const optional: <A>(schema: Schema<A>) => OptionalSchema<A, true> = I.optional

/**
 * @since 1.0.0
 */
export type OptionalKeys<T> = {
  [K in keyof T]: T[K] extends OptionalSchema<any, true> ? K : never
}[keyof T]

/**
 * @since 1.0.0
 */
export const struct: <Fields extends Record<PropertyKey, Schema<any>>>(
  fields: Fields
) => Schema<
  Spread<
    & { readonly [K in Exclude<keyof Fields, OptionalKeys<Fields>>]: Infer<Fields[K]> }
    & { readonly [K in OptionalKeys<Fields>]?: Infer<Fields[K]> }
  >
> = I.struct

/**
 * @since 1.0.0
 */
export const pick = <A, Keys extends ReadonlyArray<keyof A>>(...keys: Keys) =>
  (self: Schema<A>): Schema<{ readonly [P in Keys[number]]: A[P] }> =>
    make(AST.pick(self.ast, keys))

/**
 * @since 1.0.0
 */
export const omit = <A, Keys extends ReadonlyArray<keyof A>>(...keys: Keys) =>
  (self: Schema<A>): Schema<{ readonly [P in Exclude<keyof A, Keys[number]>]: A[P] }> =>
    make(AST.omit(self.ast, keys))

/**
 * @since 1.0.0
 */
export const partial = <A>(self: Schema<A>): Schema<Partial<A>> => make(AST.partial(self.ast))

/**
 * @since 1.0.0
 */
export const record: <K extends PropertyKey, A>(
  key: Schema<K>,
  value: Schema<A>
) => Schema<Readonly<Record<K, A>>> = I.record

/**
 * @since 1.0.0
 */
export const extend = <B>(that: Schema<B>) =>
  <A>(self: Schema<A>): Schema<A & B> => {
    if (AST.isStruct(self.ast) && AST.isStruct(that.ast)) {
      return make(AST.struct(
        self.ast.fields.concat(that.ast.fields),
        self.ast.indexSignatures.concat(that.ast.indexSignatures)
      ))
    }
    throw new Error("`extend` is not supported on this schema")
  }

/**
 * @since 1.0.0
 */
export const lazy: <A>(f: () => Schema<A>) => Schema<A> = I.lazy

/**
 * @since 1.0.0
 */
export const filter = <A, B extends A>(
  refinement: Refinement<A, B>,
  meta: unknown,
  annotations: AST.Annotated["annotations"] = {}
) => (self: Schema<A>): Schema<B> => I.refinement(self, refinement, meta, annotations)

/**
 * @since 1.0.0
 */
export const parse: <A, B>(
  decode: Decoder<A, B>["decode"],
  encode: Encoder<A, B>["encode"],
  is: (u: unknown) => u is B,
  arbitrary: Arbitrary<B>["arbitrary"],
  pretty: Pretty<B>["pretty"],
  annotations: AST.Annotated["annotations"]
) => (self: Schema<A>) => Schema<B> = DataParse.parse

/**
 * @since 1.0.0
 */
export const annotations: (
  annotations: AST.Annotated["annotations"]
) => <A>(self: Schema<A>) => Schema<A> = I.annotations

// ---------------------------------------------
// data
// ---------------------------------------------

const _undefined: Schema<undefined> = I._undefined

const _void: Schema<void> = I._void

export {
  /**
   * @since 1.0.0
   */
  _undefined as undefined,
  /**
   * @since 1.0.0
   */
  _void as void
}

/**
 * @since 1.0.0
 */
export const never: Schema<never> = I.never

/**
 * @since 1.0.0
 */
export const unknown: Schema<unknown> = I.unknown

/**
 * @since 1.0.0
 */
export const any: Schema<any> = I.any

/**
 * @since 1.0.0
 */
export const string: Schema<string> = I.string

/**
 * @since 1.0.0
 */
export const number: Schema<number> = I.number

/**
 * @since 1.0.0
 */
export const boolean: Schema<boolean> = I.boolean

/**
 * @since 1.0.0
 */
export const bigint: Schema<bigint> = I.bigint

/**
 * @since 1.0.0
 */
export const symbol: Schema<symbol> = I.symbol

/**
 * @since 1.0.0
 */
export const object: Schema<object> = I.object

/**
 * @since 1.0.0
 */
export const json: Schema<Json> = DataJson.json

/**
 * @since 1.0.0
 */
export const option: <A>(value: Schema<A>) => Schema<Option<A>> = DataOption.option
