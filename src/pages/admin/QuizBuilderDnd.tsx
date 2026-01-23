/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import logger from "@/lib/logger";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// This module avoids importing `@dnd-kit/*` at module evaluation time. Some
// environments can have duplicate React copies or incompatible dnd-kit
// versions which throw when those modules are loaded. Instead we dynamically
// import dnd-kit in a client-side effect and render the DnD UI only after the
// imports succeed. Before that, we render the static fallback UI.

function StaticQuestion({
  qi,
  qq,
  questions,
  setQuestions,
  setQuestionsJson,
}: any) {
  const updateQuestion = (updater: (q: any) => void) => {
    const copy = [...questions];
    updater(copy[qi]);
    setQuestions(copy);
    setQuestionsJson(JSON.stringify(copy, null, 2));
  };
  return (
    <div className="p-3 border rounded">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <Input
            value={qq.q}
            onChange={(e: any) =>
              updateQuestion((q: any) => {
                q.q = e.target.value;
              })
            }
            placeholder={`Question ${qi + 1}`}
          />
          <div className="mt-2">
            <div className="text-sm font-semibold mb-1">Options</div>
            {qq.options &&
              qq.options.map((opt: any, oi: number) => (
                <div key={oi} className="flex gap-2 items-center mb-2">
                  <Input
                    value={opt}
                    onChange={(e: any) =>
                      updateQuestion((q: any) => {
                        q.options[oi] = e.target.value;
                      })
                    }
                  />
                  <Button
                    variant="outline"
                    onClick={() =>
                      updateQuestion((q: any) => {
                        q.options.splice(oi, 1);
                        if (q.answer >= q.options.length)
                          q.answer = Math.max(0, q.options.length - 1);
                      })
                    }
                  >
                    Remove
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      updateQuestion((q: any) => {
                        q.answer = oi;
                      })
                    }
                    className="text-xs"
                  >
                    Set Correct
                  </Button>
                  {qq.answer === oi && (
                    <div className="text-xs text-green-600">Correct</div>
                  )}
                </div>
              ))}
            <div className="flex gap-2">
              <Button
                onClick={() =>
                  updateQuestion((q: any) => {
                    q.options.push("");
                  })
                }
              >
                Add option
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const copy = [...questions];
                  const dup = JSON.parse(JSON.stringify(copy[qi]));
                  copy.splice(qi + 1, 0, dup);
                  setQuestions(copy);
                  setQuestionsJson(JSON.stringify(copy, null, 2));
                }}
              >
                Duplicate
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="p-2 border rounded">
            Drag (install dnd-kit for real drag)
          </div>
          <div className="flex flex-col gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                if (qi > 0) {
                  const copy = arrayMoveLocal(questions, qi, qi - 1);
                  setQuestions(copy);
                  setQuestionsJson(JSON.stringify(copy, null, 2));
                }
              }}
            >
              &uarr;
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                if (qi < questions.length - 1) {
                  const copy = arrayMoveLocal(questions, qi, qi + 1);
                  setQuestions(copy);
                  setQuestionsJson(JSON.stringify(copy, null, 2));
                }
              }}
            >
              &darr;
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                const copy = [...questions];
                copy.splice(qi, 1);
                setQuestions(copy);
                setQuestionsJson(JSON.stringify(copy, null, 2));
              }}
            >
              Remove
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// local helper for StaticQuestion reordering
function arrayMoveLocal(arr: any[], from: number, to: number) {
  const copy = arr.slice();
  if (from < 0 || from >= copy.length || to < 0 || to >= copy.length)
    return copy;
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

export default function QuizBuilderDnd({
  questions,
  setQuestions,
  setQuestionsJson,
}: any) {
  const [dndReady, setDndReady] = useState(false);
  const [dndModules, setDndModules] = useState<any>(null);
  // `allowDnd` requires an explicit user action to enable experimental drag UI.
  // This prevents automatic rendering of `DndContext` which can trigger
  // invalid-hook errors in environments with duplicate React instances.
  const [canRenderDnd, setCanRenderDnd] = useState(false);
  const [allowDnd, setAllowDnd] = useState(false);

  useEffect(() => {
    let mounted = true;
    // Dynamically import dnd-kit only on the client when needed.
    (async () => {
      try {
        const core = await import("@dnd-kit/core");
        const sortable = await import("@dnd-kit/sortable");
        const utilities = await import("@dnd-kit/utilities");
        if (!mounted) return;
        setDndModules({
          DndContext: core.DndContext,
          closestCenter: core.closestCenter,
          arrayMove: sortable.arrayMove,
          SortableContext: sortable.SortableContext,
          verticalListSortingStrategy: sortable.verticalListSortingStrategy,
          useSortable: sortable.useSortable,
          CSS: utilities.CSS,
        });
        setDndReady(true);
      } catch (e) {
        // If import fails, we silently fall back to static UI.
        logger.warn(
          "dnd-kit dynamic import failed, falling back to static builder",
          e,
        );
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Use requestAnimationFrame to defer DndContext rendering until after
  // the current render cycle and at least one animation frame is complete.
  // This ensures React's fiber tree, dispatcher, and context are fully ready.
  useEffect(() => {
    // Only enable the DnD rendering flow after the user explicitly allows it.
    // Run the enable on the next animation frame to avoid rendering inside
    // the same cycle that mounted the page.
    if (!allowDnd) return;
    const frameId = requestAnimationFrame(() => {
      setCanRenderDnd(true);
    });
    return () => cancelAnimationFrame(frameId);
  }, [allowDnd]);

  // DnD modules may still be null while loading; destructure safely.
  const {
    DndContext,
    closestCenter,
    arrayMove,
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
    CSS,
  } = dndModules || {};

  // Local class-based error boundary to catch runtime errors from dnd-kit
  // (e.g., invalid hook calls) and fall back to the static UI.
  class LocalErrorBoundary extends React.Component<
    { children: React.ReactNode; fallback?: React.ReactNode },
    { hasError: boolean }
  > {
    constructor(props: any) {
      super(props);
      this.state = { hasError: false };
    }
    static getDerivedStateFromError() {
      return { hasError: true };
    }
    componentDidCatch(err: any) {
      logger.error("QuizBuilderDnd caught error", err);
    }
    render() {
      return this.state.hasError
        ? this.props.fallback || null
        : this.props.children;
    }
  }

  // Local SortableQuestion uses the dynamically imported useSortable/CSS
  function SortableQuestionInner({
    id,
    qi,
    qq,
    questions,
    setQuestions,
    setQuestionsJson,
  }: any) {
    const { attributes, listeners, setNodeRef, transform, transition } =
      useSortable({ id });
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    } as any;

    const updateQuestion = (updater: (q: any) => void) => {
      const copy = [...questions];
      updater(copy[qi]);
      setQuestions(copy);
      setQuestionsJson(JSON.stringify(copy, null, 2));
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        className="p-3 border rounded"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <Input
              value={qq.q}
              onChange={(e: any) =>
                updateQuestion((q: any) => {
                  q.q = e.target.value;
                })
              }
              placeholder={`Question ${qi + 1}`}
            />
            <div className="mt-2">
              <div className="text-sm font-semibold mb-1">Options</div>
              {qq.options &&
                qq.options.map((opt: any, oi: number) => (
                  <div key={oi} className="flex gap-2 items-center mb-2">
                    <Input
                      value={opt}
                      onChange={(e: any) =>
                        updateQuestion((q: any) => {
                          q.options[oi] = e.target.value;
                        })
                      }
                    />
                    <Button
                      variant="outline"
                      onClick={() =>
                        updateQuestion((q: any) => {
                          q.options.splice(oi, 1);
                          if (q.answer >= q.options.length)
                            q.answer = Math.max(0, q.options.length - 1);
                        })
                      }
                    >
                      Remove
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        updateQuestion((q: any) => {
                          q.answer = oi;
                        })
                      }
                      className="text-xs"
                    >
                      Set Correct
                    </Button>
                    {qq.answer === oi && (
                      <div className="text-xs text-green-600">Correct</div>
                    )}
                  </div>
                ))}
              <div className="flex gap-2">
                <Button
                  onClick={() =>
                    updateQuestion((q: any) => {
                      q.options.push("");
                    })
                  }
                >
                  Add option
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const copy = [...questions];
                    const dup = JSON.parse(JSON.stringify(copy[qi]));
                    copy.splice(qi + 1, 0, dup);
                    setQuestions(copy);
                    setQuestionsJson(JSON.stringify(copy, null, 2));
                  }}
                >
                  Duplicate
                </Button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div {...listeners} className="cursor-move p-2 border rounded">
              Drag
            </div>
            <Button
              variant="destructive"
              onClick={() => {
                const copy = [...questions];
                copy.splice(qi, 1);
                setQuestions(copy);
                setQuestionsJson(JSON.stringify(copy, null, 2));
              }}
            >
              Remove
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // No-op host while dnd-kit is not ready; real DndContext when safe.
  const DndHost: React.FC<any> = ({ children }: any) => {
    // Only render DndContext after the user explicitly allowed DnD, the
    // animation frame has completed, and modules are ready. This gating
    // prevents accidental renders that can trigger hook errors in some
    // environments.
    if (!allowDnd || !canRenderDnd || !dndReady || !DndContext) {
      return <>{children}</>;
    }
    return (
      <DndContext
        collisionDetection={closestCenter}
        onDragEnd={(event: any) => {
          const { active, over } = event;
          if (!over) return;
          const oldIndex = questions.findIndex(
            (q: any) =>
              q.id === active.id ||
              q._localId === active.id ||
              String(questions.indexOf(q)) === String(active.id),
          );
          const newIndex = questions.findIndex(
            (q: any) =>
              q.id === over.id ||
              q._localId === over.id ||
              String(questions.indexOf(q)) === String(over.id),
          );
          if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
            const copy = arrayMove(questions, oldIndex, newIndex);
            setQuestions(copy);
            setQuestionsJson(JSON.stringify(copy, null, 2));
          }
        }}
      >
        {children}
      </DndContext>
    );
  };

  return (
    <LocalErrorBoundary
      fallback={
        <div className="space-y-3">
          {questions.map((qq: any, qi: number) => (
            <StaticQuestion
              key={qq.id || qq._localId || qi}
              qi={qi}
              qq={qq}
              questions={questions}
              setQuestions={setQuestions}
              setQuestionsJson={setQuestionsJson}
            />
          ))}
        </div>
      }
    >
      {/* Control to opt-in to experimental drag UI. Default is safe static UI. */}
      <div className="mb-3 flex items-center justify-between">
        {!allowDnd ? (
          <div className="flex items-center gap-3">
            <div className="text-sm text-muted-foreground">
              Drag-and-drop is experimental.
            </div>
            <Button size="sm" onClick={() => setAllowDnd(true)}>
              Enable drag (experimental)
            </Button>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            Drag enabled — experimental.
          </div>
        )}
      </div>
      <DndHost>
        {canRenderDnd && dndReady && SortableContext ? (
          // Render SortableContext only when safe and modules are ready
          <SortableContext
            items={questions.map(
              (q: any, i: number) => q.id || q._localId || String(i),
            )}
            strategy={verticalListSortingStrategy}
          >
            {questions.map((qq: any, qi: number) => (
              <SortableQuestionInner
                key={qq.id || qq._localId || qi}
                id={qq.id || qq._localId || String(qi)}
                qq={qq}
                qi={qi}
                questions={questions}
                setQuestions={setQuestions}
                setQuestionsJson={setQuestionsJson}
              />
            ))}
          </SortableContext>
        ) : (
          <div className="space-y-3">
            {questions.map((qq: any, qi: number) => (
              <StaticQuestion
                key={qq.id || qq._localId || qi}
                qi={qi}
                qq={qq}
                questions={questions}
                setQuestions={setQuestions}
                setQuestionsJson={setQuestionsJson}
              />
            ))}
          </div>
        )}
      </DndHost>
    </LocalErrorBoundary>
  );
}
