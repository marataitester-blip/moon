{/* Хедер */}
      <header className="p-4 bg-black/90 border-b border-gray-900 flex justify-between items-center sticky top-0 z-10 backdrop-blur">
        {/* Пустой блок слева, чтобы заголовок был ровно по центру */}
        <div className="w-8"></div>
        
        <h1 style={{ color: GOLD_COLOR }} className="text-xl font-bold tracking-[0.3em]">LUNA</h1>
        
        <div className="flex gap-4 w-8 justify-end">
          {/* Кнопка удаляющая историю (Корзина) */}
          <button 
             onClick={clearHistory} 
             disabled={isDeleting} 
             className="text-gray-600 hover:text-red-900 transition-colors" 
             title="Delete History"
          >
            🗑️
          </button>
          
          {/* Кнопка ВЫХОДА (Крестик) */}
          <button 
            onClick={() => { 
              sessionStorage.removeItem(SESSION_KEY); // Забываем сессию
              setCurrentView('landing'); // Отправляем на Луну
              setPin(''); // Сбрасываем введенные цифры
            }} 
            style={{ color: GOLD_COLOR }}
            className="text-xl hover:opacity-50 transition-opacity font-bold"
            title="Log Out"
          >
            ✕
          </button>
        </div>
      </header>
